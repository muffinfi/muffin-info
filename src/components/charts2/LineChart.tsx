import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import { darken, transparentize } from 'polished'
import React, { memo, ReactNode, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled from 'styled-components/macro'
import { formatAmount, formatDollarAmount } from 'utils/numbers'
import Legend from './Legend'
import { MergedTimeSeriesDatum, TimeSeriesDatum, TimeSeriesHoverHandler } from './types'
import { cleanData } from './utils'

dayjs.extend(utc)

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
      color ?? '#2172E5', //
      theme.yellow1,
      theme.red1,
      theme.green1,
      theme.yellow2,
      theme.red2,
    ],
    [theme, color]
  )

  const gridLineColor = 'rgba(255,255,255,0.1)'
  const yAxisColor = 'rgba(255,255,255,0.0)'
  const xAxisColor = 'rgba(255,255,255,0.1)' //'#666'

  return (
    <Wrapper {...rest} height={height}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={mergedData}
          margin={{ top: 10, right: 3, left: 3, bottom: 0 }}
          onMouseLeave={() => {
            onHoverData?.(undefined)
          }}
        >
          {dataList.map((_, i) =>
            colors[i] != null ? (
              <defs key={colors[i]}>
                <linearGradient id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={darken(0.35, colors[i])} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
                </linearGradient>
              </defs>
            ) : null
          )}
          <CartesianGrid horizontal vertical={false} stroke={gridLineColor} strokeDasharray="3 3" />
          <XAxis
            dataKey="time" //
            tickFormatter={(time) => dayjs.unix(time).format('MMM D')}
            minTickGap={10}
            axisLine={{ stroke: xAxisColor }}
            tickLine={{ stroke: xAxisColor }}
          />
          <YAxis
            orientation="right"
            tickFormatter={(value) => (isDollar ? formatDollarAmount : formatAmount)(value)}
            axisLine={{ stroke: yAxisColor }}
            tickLine={{ stroke: yAxisColor }}
          />
          <Tooltip
            cursor={{ stroke: theme.bg5 }}
            contentStyle={{ display: 'none' }}
            formatter={(value: number, name: string, props_: { payload: MergedTimeSeriesDatum }) => {
              onHoverData?.(props_.payload)
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