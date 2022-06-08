import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { TickMath, tickToPrice } from '@muffinfi/muffin-v1-sdk'
import { Token } from '@uniswap/sdk-core'
import gql from 'graphql-tag'
import JSBI from 'jsbi'
import keyBy from 'lodash.keyby'
import { TierKey } from 'state/tiers/reducer'
import { normalizeKey } from 'state/tiers/utils'

const PRICE_FIXED_DIGITS = 4
const DEFAULT_SURROUNDING_TICKS = 500

const SURROUNDING_TICKS = gql`
  query surroundingTicks($tierKey: Bytes!, $tickIdxLowerBound: Int!, $tickIdxUpperBound: Int!, $skip: Int!) {
    ticks(
      subgraphError: allow
      first: 1000
      skip: $skip
      where: { tier: $tierKey, tickIdx_lte: $tickIdxUpperBound, tickIdx_gte: $tickIdxLowerBound }
    ) {
      tickIdx
      liquidityGross
      liquidityNet
      price0
      price1
    }
  }
`

interface TickPool {
  tick: string
  feeTier: string
  token0: {
    symbol: string
    id: string
    decimals: string
  }
  token1: {
    symbol: string
    id: string
    decimals: string
  }
  pool: {
    tickSpacing: number
  }
  sqrtPrice: string
  liquidity: string
}

interface TierResult {
  tier: TickPool
}

// Raw tick returned from GQL
interface Tick {
  tickIdx: string
  liquidityGross: string
  liquidityNet: string
  price0: string
  price1: string
}

interface SurroundingTicksResult {
  ticks: Tick[]
}

// Tick with fields parsed to JSBIs, and active liquidity computed.
export interface TickProcessed {
  liquidityGross: JSBI
  liquidityNet: JSBI
  tickIdx: number
  liquidityActive: JSBI
  price0: string
  price1: string
}

const fetchInitializedTicks = async (
  tierKey: TierKey,
  tickIdxLowerBound: number,
  tickIdxUpperBound: number,
  client: ApolloClient<NormalizedCacheObject>
): Promise<{ loading?: boolean; error?: boolean; ticks?: Tick[] }> => {
  let surroundingTicks: Tick[] = []
  let surroundingTicksResult: Tick[] = []
  let skip = 0
  do {
    const { data, error, loading } = await client.query<SurroundingTicksResult>({
      query: SURROUNDING_TICKS,
      fetchPolicy: 'cache-first',
      variables: {
        tierKey: normalizeKey(tierKey),
        tickIdxLowerBound,
        tickIdxUpperBound,
        skip,
      },
    })

    console.log({ data, error, loading }, 'Result. Skip: ' + skip)

    if (loading) {
      continue
    }

    if (error) {
      return { error: Boolean(error), loading, ticks: surroundingTicksResult }
    }

    surroundingTicks = data.ticks
    surroundingTicksResult = surroundingTicksResult.concat(surroundingTicks)
    skip += 1000
  } while (surroundingTicks.length > 0)

  return { ticks: surroundingTicksResult, loading: false, error: false }
}

export interface TierTickData {
  ticksProcessed: TickProcessed[]
  feeTier: string
  tickSpacing: number
  activeTickIdx: number
}

const TIER = gql`
  query tier($id: String!) {
    tier(id: $id) {
      tick
      token0 {
        symbol
        id
        decimals
      }
      token1 {
        symbol
        id
        decimals
      }
      pool {
        tickSpacing
      }
      feeTier
      sqrtGamma
      sqrtPrice
      liquidity
    }
  }
`

export const fetchTicksSurroundingPrice = async (
  tierKey: TierKey,
  client: ApolloClient<NormalizedCacheObject>,
  numSurroundingTicks = DEFAULT_SURROUNDING_TICKS
): Promise<{
  loading?: boolean
  error?: boolean
  data?: TierTickData
}> => {
  const { data: tierResult, error, loading } = await client.query<TierResult>({
    query: TIER,
    variables: {
      id: normalizeKey(tierKey),
    },
  })

  if (loading || error || !tierResult) {
    return {
      loading,
      error: Boolean(error),
      data: undefined,
    }
  }

  const {
    tier: {
      tick: poolCurrentTick,
      feeTier,
      liquidity,
      token0: { id: token0Address, decimals: token0Decimals },
      token1: { id: token1Address, decimals: token1Decimals },
    },
  } = tierResult

  const poolCurrentTickIdx = parseInt(poolCurrentTick)
  const tickSpacing = tierResult.tier.pool.tickSpacing

  // The pools current tick isn't necessarily a tick that can actually be initialized.
  // Find the nearest valid tick given the tick spacing.
  const activeTickIdx = Math.floor(poolCurrentTickIdx / tickSpacing) * tickSpacing

  // Our search bounds must take into account fee spacing. i.e. for fee tier 1%, only
  // ticks with index 200, 400, 600, etc can be active.
  const tickIdxLowerBound = activeTickIdx - numSurroundingTicks * tickSpacing
  const tickIdxUpperBound = activeTickIdx + numSurroundingTicks * tickSpacing

  const initializedTicksResult = await fetchInitializedTicks(tierKey, tickIdxLowerBound, tickIdxUpperBound, client)
  if (initializedTicksResult.error || initializedTicksResult.loading) {
    return {
      error: initializedTicksResult.error,
      loading: initializedTicksResult.loading,
    }
  }

  const { ticks: initializedTicks } = initializedTicksResult

  const tickIdxToInitializedTick = keyBy(initializedTicks, 'tickIdx')

  const token0 = new Token(1, token0Address, parseInt(token0Decimals))
  const token1 = new Token(1, token1Address, parseInt(token1Decimals))

  // console.log({ activeTickIdx, poolCurrentTickIdx }, 'Active ticks')

  // If the pool's tick is MIN_TICK (-887272), then when we find the closest
  // initializable tick to its left, the value would be smaller than MIN_TICK.
  // In this case we must ensure that the prices shown never go below/above.
  // what actual possible from the protocol.
  const activeTickIdxForPrice = Math.max(TickMath.MIN_TICK, Math.min(TickMath.MAX_TICK, activeTickIdx))

  const activeTickProcessed: TickProcessed = {
    liquidityActive: JSBI.BigInt(liquidity),
    tickIdx: activeTickIdx,
    liquidityNet: JSBI.BigInt(0),
    price0: tickToPrice(token0, token1, activeTickIdxForPrice).toFixed(PRICE_FIXED_DIGITS),
    price1: tickToPrice(token1, token0, activeTickIdxForPrice).toFixed(PRICE_FIXED_DIGITS),
    liquidityGross: JSBI.BigInt(0),
  }

  // If our active tick happens to be initialized (i.e. there is a position that starts or
  // ends at that tick), ensure we set the gross and net.
  // correctly.
  const activeTick = tickIdxToInitializedTick[activeTickIdx]
  if (activeTick) {
    activeTickProcessed.liquidityGross = JSBI.BigInt(activeTick.liquidityGross)
    activeTickProcessed.liquidityNet = JSBI.BigInt(activeTick.liquidityNet)
  }

  enum Direction {
    ASC,
    DESC,
  }

  // Computes the numSurroundingTicks above or below the active tick.
  const computeSurroundingTicks = (
    activeTickProcessed: TickProcessed,
    tickSpacing: number,
    numSurroundingTicks: number,
    direction: Direction
  ) => {
    let previousTickProcessed: TickProcessed = {
      ...activeTickProcessed,
    }

    // Iterate outwards (either up or down depending on 'Direction') from the active tick,
    // building active liquidity for every tick.
    let processedTicks: TickProcessed[] = []
    for (let i = 0; i < numSurroundingTicks; i++) {
      const currentTickIdx =
        direction == Direction.ASC
          ? previousTickProcessed.tickIdx + tickSpacing
          : previousTickProcessed.tickIdx - tickSpacing

      if (currentTickIdx < TickMath.MIN_TICK || currentTickIdx > TickMath.MAX_TICK) {
        break
      }

      const currentTickProcessed: TickProcessed = {
        liquidityActive: previousTickProcessed.liquidityActive,
        tickIdx: currentTickIdx,
        liquidityNet: JSBI.BigInt(0),
        price0: tickToPrice(token0, token1, currentTickIdx).toFixed(PRICE_FIXED_DIGITS),
        price1: tickToPrice(token1, token0, currentTickIdx).toFixed(PRICE_FIXED_DIGITS),
        liquidityGross: JSBI.BigInt(0),
      }

      // Check if there is an initialized tick at our current tick.
      // If so copy the gross and net liquidity from the initialized tick.
      const currentInitializedTick = tickIdxToInitializedTick[currentTickIdx.toString()]
      if (currentInitializedTick) {
        currentTickProcessed.liquidityGross = JSBI.BigInt(currentInitializedTick.liquidityGross)
        currentTickProcessed.liquidityNet = JSBI.BigInt(currentInitializedTick.liquidityNet)
      }

      // Update the active liquidity.
      // If we are iterating ascending and we found an initialized tick we immediately apply
      // it to the current processed tick we are building.
      // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
      if (direction == Direction.ASC && currentInitializedTick) {
        currentTickProcessed.liquidityActive = JSBI.add(
          previousTickProcessed.liquidityActive,
          JSBI.BigInt(currentInitializedTick.liquidityNet)
        )
      } else if (direction == Direction.DESC && JSBI.notEqual(previousTickProcessed.liquidityNet, JSBI.BigInt(0))) {
        // We are iterating descending, so look at the previous tick and apply any net liquidity.
        currentTickProcessed.liquidityActive = JSBI.subtract(
          previousTickProcessed.liquidityActive,
          previousTickProcessed.liquidityNet
        )
      }

      processedTicks.push(currentTickProcessed)
      previousTickProcessed = currentTickProcessed
    }

    if (direction == Direction.DESC) {
      processedTicks = processedTicks.reverse()
    }

    return processedTicks
  }

  const subsequentTicks: TickProcessed[] = computeSurroundingTicks(
    activeTickProcessed,
    tickSpacing,
    numSurroundingTicks,
    Direction.ASC
  )

  const previousTicks: TickProcessed[] = computeSurroundingTicks(
    activeTickProcessed,
    tickSpacing,
    numSurroundingTicks,
    Direction.DESC
  )

  const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

  return {
    data: {
      ticksProcessed,
      feeTier,
      tickSpacing,
      activeTickIdx,
    },
  }
}
