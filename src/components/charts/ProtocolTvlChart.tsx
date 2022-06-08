import { AutoColumn } from 'components/Column'
import { MonoSpace } from 'components/shared'
import { UTCTimestamp } from 'lightweight-charts'
import React, { useCallback, useMemo, useState } from 'react'
import { SeriesHoverDataHandler } from 'react-lightweight-charts-simple'
import { useProtocolChartData } from 'state/protocol/hooks'
import { TYPE } from 'theme'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'
import { ChartCard } from '../Card'
import Chart from './base/Chart'
import LineChart from './base/LineChart'

export default function ProtocolTvlChart({
  color = '#56B2A4',
  height,
  minHeight,
}: {
  height?: number
  minHeight?: number
  color?: string
}) {
  const [date, setDate] = useState('')
  const [price, setPrice] = useState<number | undefined>()

  const [chartData] = useProtocolChartData()

  const formattedTvlData = useMemo(
    () =>
      chartData?.map((day) => {
        return {
          time: day.date as UTCTimestamp,
          value: day.tvlUSD,
        }
      }) ?? [],

    [chartData]
  )

  const handleCrosshairMove: SeriesHoverDataHandler = useCallback((value, event) => {
    const time = event.time as UTCTimestamp
    setDate(time != null ? unixToDate(time, 'MMM D, YYYY') : '')
    setPrice(value as number)
  }, [])

  const lastValue = formattedTvlData[formattedTvlData.length - 1]?.value

  return (
    <ChartCard minHeight={minHeight}>
      <AutoColumn gap="4px">
        <TYPE.mediumHeader fontSize="16px">TVL</TYPE.mediumHeader>
        <TYPE.largeHeader fontSize="32px">
          <MonoSpace>{formatDollarAmount(price ?? lastValue, 2, true)}</MonoSpace>
        </TYPE.largeHeader>
        <TYPE.main fontSize="12px" height="14px">
          {date ? <MonoSpace>{date} (UTC)</MonoSpace> : null}
        </TYPE.main>
      </AutoColumn>
      <Chart height={height} disableScroll autoFitDeps={[formattedTvlData]}>
        <LineChart data={formattedTvlData} color={color} onHoverData={handleCrosshairMove} />
      </Chart>
    </ChartCard>
  )
}
