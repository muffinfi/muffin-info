import { DeepPartial, HistogramData, HistogramSeriesOptions, WhitespaceData } from 'lightweight-charts'
import React, { useMemo } from 'react'
import { HistogramSeries, SeriesHoverDataHandler, SeriesHoverDataSubscriber } from 'react-lightweight-charts-simple'
import { formatDollarAmount } from 'utils/numbers'

export type BarChartProps = {
  data: (HistogramData | WhitespaceData)[]
  color?: string | undefined
  onHoverData?: SeriesHoverDataHandler
}

export default function BarChart({ data, color = '#56B2A4', onHoverData }: BarChartProps) {
  const seriesOptions: DeepPartial<HistogramSeriesOptions> = useMemo(
    () => ({
      color,
      priceFormat: {
        type: 'custom',
        minMove: 0.02,
        formatter: (value: number) => formatDollarAmount(value, 2, true),
      },
      priceLineVisible: false,
    }),
    [color]
  )

  return (
    <HistogramSeries data={data} options={seriesOptions}>
      {onHoverData && <SeriesHoverDataSubscriber handler={onHoverData} />}
    </HistogramSeries>
  )
}
