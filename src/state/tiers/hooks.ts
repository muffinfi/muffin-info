import { fetchTierChartData } from 'data/tiers/chartData'
import { TierTickData } from 'data/tiers/tickData'
import { fetchTierTransactions } from 'data/tiers/transactions'
import { useMemoArray } from 'hooks/useMemoArray'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveNetworkVersion, useClients } from 'state/application/hooks'
import { Transaction } from 'types'
import { notEmpty } from 'utils'
import { AppDispatch, AppState } from './../index'
import { addKeys, updateChartData, updateData, updateTickData, updateTransactions } from './actions'
import type { TierChartEntry, TierData, TierKey } from './reducer'
import { normalizeKey } from './utils'

export function useAllTierData() {
  const [network] = useActiveNetworkVersion()
  const allTierData = useSelector((state: AppState) => state.tiers.byKey[network.id])
  return useMemo(() => allTierData ?? {}, [allTierData])
}

export function useUpdateTierData() {
  const dispatch = useDispatch<AppDispatch>()
  const [network] = useActiveNetworkVersion()
  return useCallback((tiers: TierData[]) => dispatch(updateData({ tiers, networkId: network.id })), [
    dispatch,
    network.id,
  ])
}

export function useAddTierKeys() {
  const dispatch = useDispatch<AppDispatch>()
  const [network] = useActiveNetworkVersion()
  return useCallback((keys: (string | [string, number])[]) => dispatch(addKeys({ keys, networkId: network.id })), [
    dispatch,
    network.id,
  ])
}

export function useTierDatas(keys: TierKey[]) {
  const allData = useAllTierData()
  const addKeys = useAddTierKeys()

  const keysMemoized = useMemoArray(keys)
  const normalizedKeys = useMemo(() => keysMemoized.map(normalizeKey), [keysMemoized])

  const untrackedKeys = useMemo(() => {
    return normalizedKeys.reduce((accum: string[], key) => {
      if (!Object.keys(allData).includes(key)) {
        accum.push(key)
      }
      return accum
    }, [])
  }, [normalizedKeys, allData])

  useEffect(() => {
    if (untrackedKeys.length > 0) {
      addKeys(untrackedKeys)
    }
    return
  }, [addKeys, untrackedKeys])

  // filter for keys with data
  return useMemo(() => normalizedKeys.map((key) => allData[key]?.data ?? undefined).filter(notEmpty), [
    normalizedKeys,
    allData,
  ])
}

/**
 * Get top tiers addresses that token is included in
 * If not loaded, fetch and store
 */
export function useTierChartData(key: TierKey): TierChartEntry[] | undefined {
  const dispatch = useDispatch<AppDispatch>()
  const [activeNetwork] = useActiveNetworkVersion()

  const normalizedKey = normalizeKey(key)
  const tier = useSelector((state: AppState) => state.tiers.byKey[activeNetwork.id]?.[normalizedKey])
  const chartData = tier?.chartData
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      const { error, data } = await fetchTierChartData(normalizedKey, dataClient)
      if (!error && data) {
        dispatch(updateChartData({ key: normalizedKey, chartData: data, networkId: activeNetwork.id }))
      }
      if (error) {
        setError(error)
      }
    }
    if (!chartData && !error) {
      fetch()
    }
  }, [dispatch, error, chartData, dataClient, activeNetwork.id, normalizedKey])

  // return data
  return chartData
}

/**
 * Get all transactions on tier
 */
export function useTierTransactions(key: TierKey): Transaction[] | undefined {
  const normalizedKey = normalizeKey(key)
  const dispatch = useDispatch<AppDispatch>()
  const [activeNetwork] = useActiveNetworkVersion()
  const tier = useSelector((state: AppState) => state.tiers.byKey[activeNetwork.id]?.[normalizedKey])
  const transactions = tier?.transactions
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      const { error, data } = await fetchTierTransactions(normalizedKey, dataClient)
      if (error) {
        setError(true)
      } else if (data) {
        dispatch(updateTransactions({ key: normalizedKey, transactions: data, networkId: activeNetwork.id }))
      }
    }
    if (!transactions && !error) {
      fetch()
    }
  }, [dispatch, error, transactions, dataClient, activeNetwork.id, normalizedKey])

  // return data
  return transactions
}

export function useTierTickData(
  key: TierKey
): [TierTickData | undefined, (key: TierKey, tickData: TierTickData) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const [activeNetwork] = useActiveNetworkVersion()
  const normalized = normalizeKey(key)
  const tier = useSelector((state: AppState) => state.tiers.byKey[activeNetwork.id]?.[normalized])
  const tickData = tier?.tickData

  const setPoolTickData = useCallback(
    (key: TierKey, tickData: TierTickData) => dispatch(updateTickData({ key, tickData, networkId: activeNetwork.id })),
    [activeNetwork.id, dispatch]
  )

  return [tickData, setPoolTickData]
}

/**
 * Returns true if the two given arrays have the same items
 */
const isSameArrayItems = <T>(xs: T[], ys: T[]): boolean => {
  return xs.length === ys.length && xs.every((x, i) => x === ys[i])
}

/**
 * Batch fetch tier's chart data
 */
export function useTierChartDataList(
  keys: TierKey[]
): {
  loading: boolean
  chartDataList: (TierChartEntry[] | undefined)[]
} {
  const dispatch = useDispatch<AppDispatch>()
  const [activeNetwork] = useActiveNetworkVersion()

  const normalizedKeys = useMemo(() => keys.map((key) => normalizeKey(key)), [keys])
  const tiers = useSelector(
    (state: AppState) => normalizedKeys.map((normalizedKey) => state.tiers.byKey[activeNetwork.id]?.[normalizedKey]),
    isSameArrayItems
  )
  const chartDataList = useMemo(() => tiers.map((tier) => tier?.chartData), [tiers])
  const normalizedKeysNoData = useMemo(() => normalizedKeys.filter((_normalizedKey, i) => chartDataList[i] == null), [
    normalizedKeys,
    chartDataList,
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    if (normalizedKeysNoData.length > 0 && !loading && !error) {
      ;(async function fetch() {
        try {
          setLoading(true)
          const promises = normalizedKeysNoData.map((normalizedKey) => fetchTierChartData(normalizedKey, dataClient))
          const fetched = await Promise.all(promises)

          fetched.forEach(({ error, data }, i) => {
            if (!error && data) {
              dispatch(updateChartData({ key: normalizedKeysNoData[i], chartData: data, networkId: activeNetwork.id }))
            }
            if (error) {
              setError(error)
            }
          })
          setLoading(false)
        } catch (error) {
          console.error(error)
          setError(true)
          setLoading(false)
        }
      })()
    }
  }, [dispatch, loading, error, chartDataList, dataClient, activeNetwork.id, normalizedKeysNoData])

  return { loading, chartDataList }
}
