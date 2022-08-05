import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import React, { memo, ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled from 'styled-components/macro'
import { VolumeWindow } from 'types'
import { formatDollarAmount } from 'utils/numbers'
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

export type BarChartProps = {
  data: TimeSeriesDatum[]
  color?: string | undefined
  height?: number | undefined
  onHoverData?: TimeSeriesDataHandler | undefined
  activeWindow?: VolumeWindow
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const CustomBar = ({
  x,
  y,
  width,
  height,
  fill,
}: {
  x: number
  y: number
  width: number
  height: number
  fill: string
}) => {
  return (
    <g>
      <rect x={x} y={y} fill={fill} width={width} height={height} rx="2" />
    </g>
  )
}

const Chart = ({
  data,
  color = '#56B2A4',
  height,
  onHoverData,
  activeWindow,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  ...rest
}: BarChartProps) => {
  const theme = useTheme()

  return (
    <Wrapper {...rest} height={height}>
      <RowBetween style={{ alignItems: 'flex-start' }}>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 3, left: 3, bottom: 0 }}
          onMouseLeave={() => {
            onHoverData?.({ time: undefined, value: undefined })
          }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={(time) => dayjs.unix(time).format(activeWindow === VolumeWindow.monthly ? 'MMM' : 'MMM D')}
            minTickGap={10}
          />
          <YAxis
            dataKey="value" //
            orientation="right"
            tickFormatter={(value) => formatDollarAmount(value)}
          />
          <Tooltip
            cursor={{ fill: theme.bg2 }}
            contentStyle={{ display: 'none' }}
            formatter={(value: number, name: string, props: { payload: TimeSeriesDatum }) => {
              onHoverData?.(props.payload)
            }}
          />
          <Bar
            dataKey="value"
            fill={color}
            shape={(props: any) => {
              return <CustomBar height={props.height} width={props.width} x={props.x} y={props.y} fill={color} />
            }}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default memo(Chart)
