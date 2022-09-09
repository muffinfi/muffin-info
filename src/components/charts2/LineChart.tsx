import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import { transparentize } from 'polished'
import React, { memo, ReactNode, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getNiceTickValues } from 'recharts-scale'
import { AxisDomain } from 'recharts/types/util/types'
import styled from 'styled-components/macro'
import { unixToDate } from 'utils/date'
import { formatAmount, formatDollarAmount } from 'utils/numbers'
import Legend from './Legend'
import { MergedTimeSeriesDatum, TimeSeriesDatum, TimeSeriesHoverHandler } from './types'
import { cleanData } from './utils'

dayjs.extend(utc)

const yDomain: AxisDomain = [
  0,
  (dataMax: number) => {
    const values = getNiceTickValues([0, dataMax * 1.1], 5, true)
    return values[values.length - 1]
  },
]

const Wrapper = styled(Card)`
  width: 100%;
  padding: 0;
  background-color: ${({ theme }) => theme.bg0};
  display: flex;
  flex-direction: column;
  > * {
    font-size: 12px;
  }
`

function Chart({
  data,
  isDollar = true,
  stack = true,
  color,
  height,
  labels,
  fillMissingValueWithZero = true,
  onHoverData,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  ...rest
}: {
  data: TimeSeriesDatum[] | TimeSeriesDatum[][]
  isDollar?: boolean
  color?: string | undefined
  height?: number | undefined
  labels?: string[]
  stack?: boolean
  fillMissingValueWithZero?: boolean
  onHoverData?: TimeSeriesHoverHandler | undefined
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>) {
  const { dataList, mergedData } = useMemo(() => cleanData(data, fillMissingValueWithZero ? 0 : undefined), [
    data,
    fillMissingValueWithZero,
  ])

  const theme = useTheme()
  const colors = useMemo(
    () => [
      color ?? theme.blue1, //
      theme.yellow3,
      theme.red1,
      theme.green1,
      theme.pink1,
      theme.yellow2,
    ],
    [theme, color]
  )

  const gridLineColor = 'rgba(255,255,255,0.1)'
  const xAxisColor = 'rgba(255,255,255,0.1)' //'#666'

  return (
    <Wrapper {...rest} height={height}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mergedData} margin={{ top: 10, right: 3, left: 3, bottom: 0 }}>
          {stack && (
            <defs>
              {dataList.map((_, i) =>
                colors[i] == null ? null : (
                  <linearGradient key={colors[i]} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[i]} stopOpacity={1} />
                    <stop offset="100%" stopColor={colors[i]} stopOpacity={0.5} />
                  </linearGradient>
                )
              )}
            </defs>
          )}
          <CartesianGrid horizontal vertical={false} stroke={gridLineColor} strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={(time) => unixToDate(time, 'MMM D')}
            minTickGap={10}
            axisLine={{ stroke: xAxisColor }}
            tickLine={{ stroke: xAxisColor }}
          />
          <YAxis
            orientation="right"
            tickFormatter={(value) => (isDollar ? formatDollarAmount : formatAmount)(value)}
            axisLine={false}
            tickLine={false}
            domain={yDomain}
          />
          <Tooltip
            cursor={{ stroke: theme.bg5 }}
            content={({ payload }) => {
              requestAnimationFrame(() => {
                onHoverData?.(payload?.[0]?.payload)
              })
              return null
            }}
          />
          {dataList.map((_, i) => (
            <Area
              key={i}
              stackId={stack ? '1' : undefined}
              dataKey={(datum: MergedTimeSeriesDatum) => datum.values[i]}
              type="monotone"
              stroke={transparentize(0, colors[i % colors.length])}
              fill={stack ? `url(#gradient-${i % colors.length})` : 'rgba(0,0,0,0)'}
              fillOpacity={0.7}
              strokeWidth={dataList.length > 1 ? 1 : 2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {labels && <Legend labels={labels} colors={colors} />}

      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default memo(Chart)
