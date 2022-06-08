import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'
import { useClients } from 'state/application/hooks'

export const TOP_TIERS = gql`
  query topTiers {
    tiers(first: 50, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
      id
    }
  }
`

interface TopTiersResponse {
  tiers: {
    id: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useTopTierKeys(): {
  loading: boolean
  error: boolean
  keys: string[] | undefined
} {
  const { dataClient } = useClients()
  const { loading, error, data } = useQuery<TopTiersResponse>(TOP_TIERS, {
    client: dataClient,
    fetchPolicy: 'cache-first',
  })

  const formattedData = useMemo(() => data?.tiers.map((p) => p.id), [data])

  return {
    loading: loading,
    error: Boolean(error),
    keys: formattedData,
  }
}
