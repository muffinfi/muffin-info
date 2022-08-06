import dayjs from 'dayjs'
import { useMemo } from 'react'
import { PoolChartEntry } from 'state/pools/reducer'
import { TokenChartEntry } from 'state/tokens/reducer'
import { ChartDayData, GenericChartEntry } from 'types'
import { unixToDate } from 'utils/date'

function unixToType(unix: number, type: 'month' | 'week') {
  const date = dayjs.unix(unix).utc()

  switch (type) {
    case 'month':
      return date.format('YYYY-MM')
    case 'week':
      let week = String(date.week())
      if (week.length === 1) {
        week = `0${week}`
      }
      return `${date.year()}-${week}`
  }
}

/**
 * @deprecated
 */
export function useTransformedVolumeData(
  chartData: ChartDayData[] | PoolChartEntry[] | TokenChartEntry[] | undefined,
  type: 'month' | 'week'
) {
  return useMemo(() => {
    if (chartData) {
      const data = (chartData as { date: number; volumeUSD: number }[]).reduce((memo, { date, volumeUSD }) => {
        const group = unixToType(date, type)
        if (memo[group]) {
          memo[group].value += volumeUSD
        } else {
          memo[group] = {
            time: unixToDate(date),
            value: volumeUSD,
          }
        }
        return memo
      }, {} as Record<string, GenericChartEntry>)

      return Object.values(data)
    } else {
      return []
    }
  }, [chartData, type])
}

export function useTransformedVolumeDataWithTimestamp(
  chartData: ChartDayData[] | PoolChartEntry[] | TokenChartEntry[] | undefined,
  type: 'month' | 'week'
): { time: number; value: number }[] {
  return useMemo(() => {
    if (chartData) {
      const data = (chartData as { date: number; volumeUSD: number }[]).reduce((memo, { date, volumeUSD }) => {
        const group = unixToType(date, type)
        if (memo[group]) {
          memo[group].value += volumeUSD
        } else {
          memo[group] = {
            time: date,
            value: volumeUSD,
          }
        }
        return memo
      }, {} as Record<string, { time: number; value: number }>)

      return Object.values(data)
    } else {
      return []
    }
  }, [chartData, type])
}
