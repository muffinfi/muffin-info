import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import { darken } from 'polished'
import React, { memo, ReactNode } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled from 'styled-components/macro'
import { formatAmount, formatDollarAmount } from 'utils/numbers'
import { TimeSeriesDataHandler, TimeSeriesDatum } from './types'

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

export type LineChartProps = {
  data: TimeSeriesDatum[]
  isDollar?: boolean
  color?: string | undefined
  height?: number | undefined
  onHoverData?: TimeSeriesDataHandler | undefined
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

function Chart({
  data,
  isDollar = true,
  color = '#56B2A4',
  height,
  onHoverData,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  ...rest
}: LineChartProps) {
  const theme = useTheme()
  const formatYAxisTick = isDollar ? formatDollarAmount : formatAmount

  return (
    <Wrapper {...rest} height={height}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 3, left: 3, bottom: 0 }}
          onMouseLeave={() => {
            onHoverData?.({ time: undefined, value: undefined })
          }}
        >
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={darken(0.36, color)} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis
            dataKey="time" //
            tickFormatter={(time) => dayjs.unix(time).format('MMM D')}
            minTickGap={10}
          />
          <YAxis
            dataKey="value"
            orientation="right"
            tickFormatter={(value) => formatYAxisTick(value)}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            // tick={{ fill: theme.text2 }}
          />
          <Tooltip
            cursor={{ stroke: theme.bg5 }}
            contentStyle={{ display: 'none' }}
            formatter={(value: number, name: string, props_: { payload: TimeSeriesDatum }) => {
              onHoverData?.(props_.payload)
            }}
          />
          <Area
            dataKey="value"
            type="monotone"
            stroke={color}
            fill="url(#gradient)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default memo(Chart)
