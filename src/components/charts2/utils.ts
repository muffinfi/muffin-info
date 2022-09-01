import { MergedTimeSeriesDatum, TimeSeriesDatum } from './types'

/**
 * Merge a list of time series data into one merged series.
 *
 * Before:
 * - dataList[0]:   ────a───────────────b───────────▶
 * - dataList[1]:   ────────c────d────────────e─────▶
 *
 * After:
 * - merged.value0: ────a───a────a──────b─────b─────▶
 * - merged.value1: ────0───c────d──────d─────e─────▶
 */
export const mergeTimeSeriesData = (
  dataList: TimeSeriesDatum[][],
  ascending: boolean,
  initialEmptyValue?: number | undefined
): MergedTimeSeriesDatum[] => {
  if (dataList.length === 0) return []
  if (dataList.length === 1) {
    return dataList[0].map((data) => ({
      time: data.time,
      values: [data.value],
      metadatas: [data.metadata],
    }))
  }
  const sortedDataList = dataList.map((data) =>
    [...data].sort((a, b) => (a.time < b.time ? -1 : 1) * (ascending ? 1 : -1))
  )
  const indexes = sortedDataList.map(() => -1)
  const mergedData: MergedTimeSeriesDatum[] = []

  while (true) {
    const nextTimes = sortedDataList.map((data, j) => data[indexes[j] + 1]?.time)
    const nextTimesNonNull = nextTimes.filter((time) => time != null)
    if (nextTimesNonNull.length === 0) break

    const nextTime = (ascending ? Math.min : Math.max)(...nextTimesNonNull)
    nextTimes.forEach((time, j) => {
      if (time === nextTime) indexes[j] += 1
    })

    const mergedDatum: MergedTimeSeriesDatum = {
      time: nextTime,
      values: [],
      metadatas: [],
    }
    sortedDataList.forEach((data, j) => {
      const i = indexes[j]
      mergedDatum.values[j] = i === -1 ? initialEmptyValue : data[i].value
      mergedDatum.metadatas[j] = i === -1 ? undefined : data[i].metadata
    })
    mergedData.push(mergedDatum)
  }

  return mergedData
}

export const cleanData = (data: TimeSeriesDatum[] | TimeSeriesDatum[][], initialEmptyValue?: number | undefined) => {
  const dataList = (Array.isArray(data[0]) ? data : [data]) as TimeSeriesDatum[][]
  const mergedData = mergeTimeSeriesData(dataList, true, initialEmptyValue)
  return { dataList, mergedData }
}
