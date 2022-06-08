import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useCallback, useMemo } from 'react'
import { useActiveNetworkVersion, useClients } from 'state/application/hooks'
import { TierData, TierKey } from 'state/tiers/reducer'
import { normalizeKey } from 'state/tiers/utils'
import { get2DayChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'
import { formatTokenName, formatTokenSymbol } from 'utils/tokens'

export const TIERS_BULK = (block: number | undefined, normaledKeys: string[]) => {
  const queryString = `
    query tiers {
      tiers(
        where: {id_in: ${JSON.stringify(normaledKeys)}},
        ${block ? `block: {number: ${block}} ,` : ''}
        orderBy: totalValueLockedUSD,
        orderDirection: desc,
        subgraphError: allow
      ) {
        id
        tierId
        poolId
        feeTier
        sqrtGamma
        liquidity
        sqrtPrice
        tick
        nextTickAbove
        nextTickBelow
        token0Price
        token1Price
        pool {
          tickSpacing

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
        }
        volumeUSD
        feesUSD
        txCount
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
      }
    }
  `
  return gql(queryString)
}

interface TierFields {
  id: string
  tierId: number
  poolId: string
  sqrtGamma: string
  feeTier: string
  liquidity: string
  sqrtPrice: string
  tick: string
  nextTickAbove: string
  nextTickBelow: string
  token0Price: string
  token1Price: string
  pool: {
    tickSpacing: number
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
  }
  volumeUSD: string
  feesUSD: string
  txCount: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  totalValueLockedUSD: string
}

interface TierDataResponse {
  tiers: TierFields[]
}

/**
 * Fetch top tier keys by volume
 */
export function useTierDatas(
  keys: TierKey[]
): {
  loading: boolean
  error: boolean
  data:
    | {
        [tierKey: string]: TierData
      }
    | undefined
} {
  // get client
  const { dataClient: client } = useClients()
  const [activeNetwork] = useActiveNetworkVersion()

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])
  const [block24, block48, blockWeek] = blocks ?? []

  const queryOptions = { client }

  const normalizedKeys = useMemo(() => keys.map(normalizeKey), [keys])

  const { loading, error, data } = useQuery<TierDataResponse>(TIERS_BULK(undefined, normalizedKeys), queryOptions)

  const { loading: loading24, error: error24, data: data24 } = useQuery<TierDataResponse>(
    TIERS_BULK(block24?.number, normalizedKeys),
    queryOptions
  )
  const { loading: loading48, error: error48, data: data48 } = useQuery<TierDataResponse>(
    TIERS_BULK(block48?.number, normalizedKeys),
    queryOptions
  )
  const { loading: loadingWeek, error: errorWeek, data: dataWeek } = useQuery<TierDataResponse>(
    TIERS_BULK(blockWeek?.number, normalizedKeys),
    queryOptions
  )

  const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)

  const parseTierData = useCallback(
    (tiers: TierFields[] | undefined) =>
      anyError || anyLoading
        ? undefined
        : tiers
        ? tiers.reduce((accum: { [key: string]: TierFields }, data) => {
            accum[data.id] = data
            return accum
          }, {})
        : {},
    [anyError, anyLoading]
  )

  const parsed = useMemo(() => parseTierData(data?.tiers), [parseTierData, data?.tiers])
  const parsed24 = useMemo(() => parseTierData(data24?.tiers), [parseTierData, data24?.tiers])
  const parsed48 = useMemo(() => parseTierData(data48?.tiers), [parseTierData, data48?.tiers])
  const parsedWeek = useMemo(() => parseTierData(dataWeek?.tiers), [parseTierData, dataWeek?.tiers])

  // format data and calculate daily changes
  const formatted = useMemo(
    () =>
      anyError || anyLoading
        ? undefined
        : normalizedKeys.reduce((accum: { [tierKey: string]: TierData }, tierKey) => {
            const current: TierFields | undefined = parsed?.[tierKey]
            const oneDay: TierFields | undefined = parsed24?.[tierKey]
            const twoDay: TierFields | undefined = parsed48?.[tierKey]
            const week: TierFields | undefined = parsedWeek?.[tierKey]

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

            const [feesUSD, feesUSDChange] =
              current && oneDay && twoDay
                ? get2DayChange(current.feesUSD, oneDay.feesUSD, twoDay.feesUSD)
                : current
                ? [parseFloat(current.feesUSD), 0]
                : [0, 0]

            const feesUSDWeek =
              current && week
                ? parseFloat(current.feesUSD) - parseFloat(week.feesUSD)
                : current
                ? parseFloat(current.feesUSD)
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

            if (!current) return accum

            accum[tierKey] = {
              tierId: current.tierId,
              poolId: current.poolId,
              feeTier: parseInt(current.feeTier),
              tick: parseFloat(current.tick),
              nextTickAbove: parseFloat(current.nextTickAbove),
              nextTickBelow: parseFloat(current.nextTickBelow),
              token0Price: parseFloat(current.token0Price),
              token1Price: parseFloat(current.token1Price),
              liquidity: parseFloat(current.liquidity),
              sqrtGamma: parseFloat(current.sqrtGamma),
              sqrtPrice: parseFloat(current.sqrtPrice),
              pool: {
                tickSpacing: current.pool.tickSpacing,
                token0: {
                  address: current.pool.token0.id,
                  name: formatTokenName(current.pool.token0.id, current.pool.token0.name, activeNetwork),
                  symbol: formatTokenSymbol(current.pool.token0.id, current.pool.token0.symbol, activeNetwork),
                  decimals: parseInt(current.pool.token0.decimals),
                  derivedETH: parseFloat(current.pool.token0.derivedETH),
                },
                token1: {
                  address: current.pool.token1.id,
                  name: formatTokenName(current.pool.token1.id, current.pool.token1.name, activeNetwork),
                  symbol: formatTokenSymbol(current.pool.token1.id, current.pool.token1.symbol, activeNetwork),
                  decimals: parseInt(current.pool.token1.decimals),
                  derivedETH: parseFloat(current.pool.token1.derivedETH),
                },
              },

              volumeUSD,
              volumeUSDChange,
              volumeUSDWeek,
              tvlUSD,
              tvlUSDChange,
              tvlToken0,
              tvlToken1,
              feesUSD,
              feesUSDChange,
              feesUSDWeek,
            }

            return accum
          }, {}),
    [activeNetwork, anyError, anyLoading, normalizedKeys, parsed, parsed24, parsed48, parsedWeek]
  )

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
