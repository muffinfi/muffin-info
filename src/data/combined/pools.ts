import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useCallback, useMemo } from 'react'
import { useActiveNetworkVersion, useClients } from 'state/application/hooks'
import { PoolData } from 'state/pools/reducer'
import { get2DayChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'
import { formatTokenName, formatTokenSymbol } from 'utils/tokens'

export const POOLS_BULK = (block: number | undefined, pools: string[]) => {
  let poolString = `[`
  pools.map((address) => {
    return (poolString += `"${address}",`)
  })
  poolString += ']'
  const queryString = `
    query pools {
      pools(
        where: {id_in: ${poolString}},
        ${block ? `block: {number: ${block}} ,` : ''}
        orderBy: totalValueLockedUSD,
        orderDirection: desc,
        subgraphError: allow
      ) {
        id
        token0 {
            id
            symbol
            name
            decimals
            derivedETH
        }
        token1 {
            id
            symbol
            name
            decimals
            derivedETH
        }
        tiers {
          feeTier
          tierId
          sqrtGamma
          liquidity
          sqrtGamma
          sqrtPrice
          tick
          token0Price
          token1Price
        }
        tickSpacing
        volumeUSD
        txCount
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
      }
    }
  `
  return gql(queryString)
}

interface PoolFields {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  tiers: {
    tierId: number
    feeTier: string
    liquidity: string
    sqrtPrice: string
    sqrtGamma: string
    tick: string
    token0Price: string
    token1Price: string
  }[]
  tickSpacing: number
  volumeUSD: string
  txCount: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  totalValueLockedUSD: string
}

interface PoolDataResponse {
  pools: PoolFields[]
}

/**
 * Fetch top addresses by volume
 */
export function usePoolDatas(
  poolAddresses: string[]
): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: PoolData
      }
    | undefined
} {
  // get client
  const { dataClient } = useClients()
  const [activeNetwork] = useActiveNetworkVersion()

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])
  const [block24, block48, blockWeek] = blocks ?? []

  const { loading, error, data } = useQuery<PoolDataResponse>(POOLS_BULK(undefined, poolAddresses), {
    client: dataClient,
  })

  const { loading: loading24, error: error24, data: data24 } = useQuery<PoolDataResponse>(
    POOLS_BULK(block24?.number, poolAddresses),
    { client: dataClient }
  )
  const { loading: loading48, error: error48, data: data48 } = useQuery<PoolDataResponse>(
    POOLS_BULK(block48?.number, poolAddresses),
    { client: dataClient }
  )
  const { loading: loadingWeek, error: errorWeek, data: dataWeek } = useQuery<PoolDataResponse>(
    POOLS_BULK(blockWeek?.number, poolAddresses),
    { client: dataClient }
  )

  const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)

  const parsePoolData = useCallback(
    (pools: PoolFields[] | undefined) =>
      anyError || anyLoading
        ? undefined
        : pools
        ? pools.reduce((accum: { [address: string]: PoolFields }, poolData) => {
            accum[poolData.id] = poolData
            return accum
          }, {})
        : {},
    [anyError, anyLoading]
  )

  const parsed = useMemo(() => parsePoolData(data?.pools), [parsePoolData, data?.pools])
  const parsed24 = useMemo(() => parsePoolData(data24?.pools), [parsePoolData, data24?.pools])
  const parsed48 = useMemo(() => parsePoolData(data48?.pools), [parsePoolData, data48?.pools])
  const parsedWeek = useMemo(() => parsePoolData(dataWeek?.pools), [parsePoolData, dataWeek?.pools])

  // format data and calculate daily changes
  const formatted = useMemo(
    () =>
      anyError || anyLoading
        ? undefined
        : poolAddresses.reduce((accum: { [address: string]: PoolData }, poolId) => {
            const current: PoolFields | undefined = parsed?.[poolId]
            const oneDay: PoolFields | undefined = parsed24?.[poolId]
            const twoDay: PoolFields | undefined = parsed48?.[poolId]
            const week: PoolFields | undefined = parsedWeek?.[poolId]

            const [volumeUSD, volumeUSDChange] =
              current && oneDay && twoDay
                ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
                : current
                ? [parseFloat(current.volumeUSD), 0]
                : [0, 0]

            const volumeUSDWeek =
              current && week
                ? parseFloat(current.volumeUSD) - parseFloat(week.volumeUSD)
                : current
                ? parseFloat(current.volumeUSD)
                : 0

            const tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0

            const tvlUSDChange =
              current && oneDay
                ? ((parseFloat(current.totalValueLockedUSD) - parseFloat(oneDay.totalValueLockedUSD)) /
                    parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD)) *
                  100
                : 0

            const tvlToken0 = current ? parseFloat(current.totalValueLockedToken0) : 0
            const tvlToken1 = current ? parseFloat(current.totalValueLockedToken1) : 0

            if (current) {
              accum[poolId] = {
                poolId,
                token0: {
                  address: current.token0.id,
                  name: formatTokenName(current.token0.id, current.token0.name, activeNetwork),
                  symbol: formatTokenSymbol(current.token0.id, current.token0.symbol, activeNetwork),
                  decimals: parseInt(current.token0.decimals),
                  derivedETH: parseFloat(current.token0.derivedETH),
                },
                token1: {
                  address: current.token1.id,
                  name: formatTokenName(current.token1.id, current.token1.name, activeNetwork),
                  symbol: formatTokenSymbol(current.token1.id, current.token1.symbol, activeNetwork),
                  decimals: parseInt(current.token1.decimals),
                  derivedETH: parseFloat(current.token1.derivedETH),
                },
                tiers: current.tiers.map((tier) => ({
                  tierId: tier.tierId,
                  feeTier: parseInt(tier.feeTier),
                  tick: parseFloat(tier.tick),
                  nextTickAbove: parseFloat(tier.tick),
                  nextTickBelow: parseFloat(tier.tick),
                  token0Price: parseFloat(tier.token0Price),
                  token1Price: parseFloat(tier.token1Price),
                  liquidity: parseFloat(tier.liquidity),
                  sqrtGamma: parseFloat(tier.sqrtGamma),
                  sqrtPrice: parseFloat(tier.sqrtPrice),
                })),
                tickSpacing: current.tickSpacing,
                volumeUSD,
                volumeUSDChange,
                volumeUSDWeek,
                tvlUSD,
                tvlUSDChange,
                tvlToken0,
                tvlToken1,
                feesUSD: 0,
                feesUSDChange: 0,
                feesUSDWeek: 0,
              }
            }

            return accum
          }, {}),
    [activeNetwork, anyError, anyLoading, parsed, parsed24, parsed48, parsedWeek, poolAddresses]
  )

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
