import useTheme from 'hooks/useTheme'
import { AreaSeriesOptions, DeepPartial, SingleValueData, WhitespaceData } from 'lightweight-charts'
import { darken } from 'polished'
import React, { useMemo } from 'react'
import { AreaSeries, SeriesHoverDataHandler, SeriesHoverDataSubscriber } from 'react-lightweight-charts-simple'
import { formatDollarAmount } from 'utils/numbers'

export type LineChartProps = {
  data: (SingleValueData | WhitespaceData)[]
  color?: string | undefined
  onHoverData?: SeriesHoverDataHandler
}

export default function LineChart({ data, color = '#56B2A4', onHoverData }: LineChartProps) {
  const theme = useTheme()

  const seriesOptions: DeepPartial<AreaSeriesOptions> = useMemo(
    () => ({
      topColor: darken(0.36, color),
      bottomColor: theme.bg0,
      lineColor: color,
      priceFormat: {
        type: 'custom',
        minMove: 0.02,
        formatter: (value: number) => formatDollarAmount(value, 2, true),
      },
      priceLineVisible: false,
    }),
    [color, theme]
  )

  return (
    <AreaSeries data={data} options={seriesOptions}>
      {onHoverData && <SeriesHoverDataSubscriber handler={onHoverData} />}
    </AreaSeries>
  )
}
