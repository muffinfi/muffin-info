import { client } from 'apollo/client'
import { useFetchedTokenDatas } from 'data/tokens/tokenData'
import gql from 'graphql-tag'
import { useEffect, useMemo, useState } from 'react'
import { useAllPoolData, usePoolDatas } from 'state/pools/hooks'
import { PoolData } from 'state/pools/reducer'
import { useAllTierData, useTierDatas } from 'state/tiers/hooks'
import { TierData } from 'state/tiers/reducer'
import { normalizeKey } from 'state/tiers/utils'
import { useAllTokenData } from 'state/tokens/hooks'
import { TokenData } from 'state/tokens/reducer'
import { escapeRegExp, notEmpty } from 'utils'

export const TOKEN_SEARCH = gql`
  query tokens($value: String, $id: String) {
    asSymbol: tokens(
      where: { symbol_contains: $value }
      orderBy: totalValueLockedUSD
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      symbol
      name
      totalValueLockedUSD
    }
    asName: tokens(
      where: { name_contains: $value }
      orderBy: totalValueLockedUSD
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      symbol
      name
      totalValueLockedUSD
    }
    asAddress: tokens(where: { id: $id }, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
      id
      symbol
      name
      totalValueLockedUSD
    }
  }
`

export const POOL_SEARCH = gql`
  query pools($tokens: [Bytes]!, $id: String) {
    as0: pools(where: { token0_in: $tokens }, subgraphError: allow) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
      tiers {
        tierId
        sqrtGamma
      }
    }
    as1: pools(where: { token1_in: $tokens }, subgraphError: allow) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
      tiers {
        tierId
        sqrtGamma
      }
    }
    asId: pools(where: { id: $id }, subgraphError: allow) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
      tiers {
        tierId
        sqrtGamma
      }
    }
  }
`

export const TIER_SEARCH = gql`
  query tiers($tokens: [Bytes]!, $id: String) {
    as0: tiers(where: { token0_in: $tokens }, subgraphError: allow) {
      id
      poolId
      tierId
      sqrtGamma
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    as1: tiers(where: { token1_in: $tokens }, subgraphError: allow) {
      id
      poolId
      tierId
      sqrtGamma
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    asPoolId: tiers(where: { poolId: $id }, subgraphError: allow) {
      id
      poolId
      tierId
      sqrtGamma
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
  }
`

interface TokenRes {
  asSymbol: {
    id: string
    symbol: string
    name: string
    totalValueLockedUSD: string
  }[]
  asName: {
    id: string
    symbol: string
    name: string
    totalValueLockedUSD: string
  }[]
  asAddress: {
    id: string
    symbol: string
    name: string
    totalValueLockedUSD: string
  }[]
}

interface PoolResFields {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
  }
  token1: {
    id: string
    symbol: string
    name: string
  }
  tiers: {
    tierId: number
    sqrtGamma: string
  }[]
}

interface PoolResFields {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
  }
  token1: {
    id: string
    symbol: string
    name: string
  }
  tiers: {
    tierId: number
    sqrtGamma: string
  }[]
}

interface PoolRes {
  as0: PoolResFields[]
  as1: PoolResFields[]
  asId: PoolResFields[]
}

interface TierResFields {
  id: string
  poolId: string
  tierId: number
  sqrtGamma: string
  token0: {
    id: string
    symbol: string
    name: string
  }
  token1: {
    id: string
    symbol: string
    name: string
  }
}

interface TierRes {
  as0: TierResFields[]
  as1: TierResFields[]
  asPoolId: TierResFields[]
}

const getTokenMatch = (token: { name: string; symbol: string }, escapedRegExp: string) =>
  token.name.match(new RegExp(escapedRegExp, 'i')) || token.symbol.match(new RegExp(escapedRegExp, 'i'))

export function useFetchSearchResults(
  value: string
): {
  tokens: TokenData[]
  pools: PoolData[]
  tiers: TierData[]
  loading: boolean
} {
  const allTokens = useAllTokenData()
  const allPools = useAllPoolData()
  const allTiers = useAllTierData()

  const [tokenData, setTokenData] = useState<TokenRes | undefined>()
  const [poolData, setPoolData] = useState<PoolRes | undefined>()
  const [tierData, setTierData] = useState<TierRes | undefined>()

  // fetch data based on search input
  useEffect(() => {
    async function fetch() {
      try {
        const tokens = await client.query<TokenRes>({
          query: TOKEN_SEARCH,
          variables: {
            value: value ? value.toUpperCase() : '',
            id: value,
          },
        })

        const [pools, tiers] = await Promise.all([
          client.query<PoolRes>({
            query: POOL_SEARCH,
            variables: {
              tokens: tokens.data.asSymbol?.map((t) => t.id),
              id: value,
            },
          }),
          client.query<TierRes>({
            query: TIER_SEARCH,
            variables: {
              tokens: tokens.data.asSymbol?.map((t) => t.id),
              id: value,
            },
          }),
        ])

        if (tokens.data) {
          setTokenData(tokens.data)
        }
        if (pools.data) {
          setPoolData(pools.data)
        }
        if (tiers.data) {
          setTierData(tiers.data)
        }
      } catch (e) {
        console.log(e)
      }
    }
    if (value && value.length > 0) {
      fetch()
    }
  }, [value])

  const allFetchedTokens = useMemo(() => {
    if (tokenData) {
      return [...tokenData.asAddress, ...tokenData.asName, ...tokenData.asSymbol]
    }
    return []
  }, [tokenData])

  const allFetchedPools = useMemo(() => {
    if (poolData) {
      return [...poolData.asId, ...poolData.as0, ...poolData.as1]
    }
    return []
  }, [poolData])

  const allFetchedTiers = useMemo(() => {
    if (tierData) {
      return [...tierData.asPoolId, ...tierData.as0, ...tierData.as1]
    }
    return []
  }, [tierData])

  // format as token and pool datas
  const { data: tokenFullDatas, loading: tokenFullLoading } = useFetchedTokenDatas(
    useMemo(() => allFetchedTokens.map((t) => t.id), [allFetchedTokens])
  )
  const poolDatasFull = usePoolDatas(useMemo(() => allFetchedPools.map((p) => p.id), [allFetchedPools]))
  const tierDatasFull = useTierDatas(useMemo(() => allFetchedTiers.map((p) => p.id), [allFetchedTiers]))
  const formattedTokens = useMemo(() => (tokenFullDatas ? Object.values(tokenFullDatas) : []), [tokenFullDatas])

  const newTokens = useMemo(() => {
    return formattedTokens.filter((t) => !Object.keys(allTokens).includes(t.address))
  }, [allTokens, formattedTokens])

  const combinedTokens = useMemo(() => {
    return [
      ...newTokens,
      ...Object.values(allTokens)
        .map((t) => t.data)
        .filter(notEmpty),
    ]
  }, [allTokens, newTokens])

  const filteredSortedTokens = useMemo(() => {
    return combinedTokens.filter((t) => {
      const regexMatches = Object.keys(t).map((tokenEntryKey) => {
        const isAddress = value.slice(0, 2) === '0x'
        if (tokenEntryKey === 'address' && isAddress) {
          return t[tokenEntryKey].match(new RegExp(escapeRegExp(value), 'i'))
        }
        if (tokenEntryKey === 'symbol' && !isAddress) {
          return t[tokenEntryKey].match(new RegExp(escapeRegExp(value), 'i'))
        }
        if (tokenEntryKey === 'name' && !isAddress) {
          return t[tokenEntryKey].match(new RegExp(escapeRegExp(value), 'i'))
        }
        return false
      })
      return regexMatches.some((m) => m)
    })
  }, [combinedTokens, value])

  const newPools = useMemo(() => {
    const allKeys = Object.keys(allPools)
    return poolDatasFull.filter((p) => !allKeys.includes(p.poolId))
  }, [allPools, poolDatasFull])

  const newTiers = useMemo(() => {
    const allKeys = Object.keys(allTiers)
    return tierDatasFull.filter((p) => !allKeys.includes(normalizeKey([p.poolId, p.tierId])))
  }, [allTiers, tierDatasFull])

  const combinedPools = useMemo(() => {
    return [
      ...newPools,
      ...Object.values(allPools)
        .map((p) => p.data)
        .filter(notEmpty),
    ]
  }, [allPools, newPools])

  const combinedTiers = useMemo(() => {
    return [
      ...newTiers,
      ...Object.values(allTiers)
        .map((p) => p.data)
        .filter(notEmpty),
    ]
  }, [newTiers, allTiers])

  const filteredSortedPools = useMemo(() => {
    return combinedPools.filter((t) => {
      const escapedRegExp = escapeRegExp(value)
      return (
        t.poolId.match(new RegExp(escapedRegExp, 'i')) ||
        getTokenMatch(t.token0, escapedRegExp) ||
        getTokenMatch(t.token1, escapedRegExp)
      )
    })
  }, [combinedPools, value])

  const filteredSortedTiers = useMemo(() => {
    return combinedTiers.filter((t) => {
      const escapedRegExp = escapeRegExp(value)
      return (
        t.poolId.match(new RegExp(escapedRegExp, 'i')) ||
        getTokenMatch(t.pool.token0, escapedRegExp) ||
        getTokenMatch(t.pool.token1, escapedRegExp)
      )
    })
  }, [combinedTiers, value])

  return {
    tokens: filteredSortedTokens,
    pools: filteredSortedPools,
    tiers: filteredSortedTiers,
    loading: tokenFullLoading,
  }
}
