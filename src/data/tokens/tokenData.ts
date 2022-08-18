import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useEthPrices } from 'hooks/useEthPrices'
import { useMemo } from 'react'
import { useActiveNetworkVersion, useClients } from 'state/application/hooks'
import { TokenData } from 'state/tokens/reducer'
import { get2DayChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'
import { formatTokenName, formatTokenSymbol } from 'utils/tokens'
import { getPercentChange } from './../../utils/data'

export const TOKENS_BULK = (block: number | undefined, tokens: string[]) => {
  const queryString =
    `
    query tokens {
      tokens(where: {id_in: ${JSON.stringify(tokens)}},` +
    (block ? `block: {number: ${block}} ,` : ``) +
    ` orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
        id
        symbol
        name
        derivedETH
        volumeUSD
        volume
        txCount
        totalValueLocked
        feesUSD
        totalValueLockedUSD
      }
    }
    `
  return gql(queryString)
}

interface TokenFields {
  id: string
  symbol: string
  name: string
  derivedETH: string
  volumeUSD: string
  volume: string
  feesUSD: string
  txCount: string
  totalValueLocked: string
  totalValueLockedUSD: string
}

interface TokenDataResponse {
  tokens: TokenFields[]
  bundles: {
    ethPriceUSD: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useFetchedTokenDatas(
  tokenAddresses: string[]
): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: TokenData
      }
    | undefined
} {
  const [activeNetwork] = useActiveNetworkVersion()
  const { dataClient } = useClients()

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()

  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])
  const [block24, block48, blockWeek] = blocks ?? []
  const ethPrices = useEthPrices()

  const skipQuery = tokenAddresses.length === 0

  const { loading, error, data } = useQuery<TokenDataResponse>(TOKENS_BULK(undefined, tokenAddresses), {
    client: dataClient,
    skip: skipQuery,
  })

  const { loading: loading24, error: error24, data: data24 } = useQuery<TokenDataResponse>(
    TOKENS_BULK(parseInt(block24?.number), tokenAddresses),
    {
      client: dataClient,
      skip: skipQuery,
    }
  )

  const { loading: loading48, error: error48, data: data48 } = useQuery<TokenDataResponse>(
    TOKENS_BULK(parseInt(block48?.number), tokenAddresses),
    {
      client: dataClient,
      skip: skipQuery,
    }
  )

  const { loading: loadingWeek, error: errorWeek, data: dataWeek } = useQuery<TokenDataResponse>(
    TOKENS_BULK(parseInt(blockWeek?.number), tokenAddresses),
    {
      client: dataClient,
      skip: skipQuery,
    }
  )

  const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek || !blocks)

  const parsed = useMemo(() => {
    return (
      data?.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {}) ?? {}
    )
  }, [data])
  const parsed24 = useMemo(() => {
    return (
      data24?.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {}) ?? {}
    )
  }, [data24])
  const parsed48 = useMemo(() => {
    return (
      data48?.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {}) ?? {}
    )
  }, [data48])
  const parsedWeek = useMemo(() => {
    return (
      dataWeek?.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {}) ?? {}
    )
  }, [dataWeek])

  // format data and calculate daily changes
  const formatted = useMemo(() => {
    return tokenAddresses.reduce((accum: { [address: string]: TokenData }, address) => {
      const current: TokenFields | undefined = parsed[address]
      const oneDay: TokenFields | undefined = parsed24[address]
      const twoDay: TokenFields | undefined = parsed48[address]
      const week: TokenFields | undefined = parsedWeek[address]

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
      const tvlUSDChange = getPercentChange(current?.totalValueLockedUSD, oneDay?.totalValueLockedUSD)
      const tvlToken = current ? parseFloat(current.totalValueLocked) : 0
      const priceUSD = ethPrices && current ? parseFloat(current.derivedETH) * ethPrices.current : 0
      const priceUSDOneDay = ethPrices && oneDay ? parseFloat(oneDay.derivedETH) * ethPrices.oneDay : 0
      const priceUSDWeek = ethPrices && week ? parseFloat(week.derivedETH) * ethPrices.week : 0
      const priceUSDChange =
        priceUSD && priceUSDOneDay ? getPercentChange(priceUSD.toString(), priceUSDOneDay.toString()) : 0

      const priceUSDChangeWeek =
        priceUSD && priceUSDWeek ? getPercentChange(priceUSD.toString(), priceUSDWeek.toString()) : 0
      const txCount =
        current && oneDay
          ? parseFloat(current.txCount) - parseFloat(oneDay.txCount)
          : current
          ? parseFloat(current.txCount)
          : 0
      const feesUSD =
        current && oneDay
          ? parseFloat(current.feesUSD) - parseFloat(oneDay.feesUSD)
          : current
          ? parseFloat(current.feesUSD)
          : 0

      accum[address] = {
        exists: !!current,
        address,
        name: current ? formatTokenName(address, current.name, activeNetwork) : '',
        symbol: current ? formatTokenSymbol(address, current.symbol, activeNetwork) : '',
        volumeUSD,
        volumeUSDChange,
        volumeUSDWeek,
        txCount,
        tvlUSD,
        feesUSD,
        tvlUSDChange,
        tvlToken,
        priceUSD,
        priceUSDChange,
        priceUSDChangeWeek,
      }

      return accum
    }, {})
  }, [tokenAddresses, parsed, parsed24, parsed48, parsedWeek, ethPrices, activeNetwork])

  if (!ethPrices) {
    return {
      loading: true,
      error: false,
      data: undefined,
    }
  }

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
