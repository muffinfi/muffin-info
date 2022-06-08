import { useTierDatas } from 'data/tiers/tierData'
import { useTopTierKeys } from 'data/tiers/topTiers'
import { useEffect, useMemo } from 'react'
import { useAddTierKeys, useAllTierData, useUpdateTierData } from './hooks'

export default function Updater(): null {
  // updaters
  const updateData = useUpdateTierData()
  const addKeys = useAddTierKeys()

  // data
  const allTierData = useAllTierData()
  const { loading, error, keys } = useTopTierKeys()

  // add top pools on first load
  useEffect(() => {
    if (keys && !error && !loading) {
      addKeys(keys)
    }
  }, [addKeys, error, keys, loading])

  // detect for which addresses we havent loaded pool data yet
  const unfetchedTierKeys = useMemo(() => {
    return Object.keys(allTierData).reduce((accum: string[], key) => {
      const tierData = allTierData[key]
      if (!tierData.data || !tierData.lastUpdated) {
        accum.push(key)
      }
      return accum
    }, [])
  }, [allTierData])

  // update unloaded pool entries with fetched data
  const { error: tierDataError, loading: tierDataLoading, data: tierDatas } = useTierDatas(unfetchedTierKeys)

  useEffect(() => {
    if (tierDatas && !tierDataError && !tierDataLoading) {
      updateData(Object.values(tierDatas))
    }
  }, [tierDataError, tierDataLoading, tierDatas, updateData])

  return null
}
