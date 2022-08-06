import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import { transparentize } from 'polished'
import React, { memo, ReactNode, useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled from 'styled-components/macro'
import { VolumeWindow } from 'types'
import { formatDollarAmount } from 'utils/numbers'
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

const Chart = ({
  data,
  color,
  height,
  labels,
  onHoverData,
  activeWindow,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  ...rest
}: {
  data: TimeSeriesDatum[] | TimeSeriesDatum[][]
  color?: string | undefined
  height?: number | undefined
  labels?: string[]
  onHoverData?: TimeSeriesHoverHandler | undefined
  activeWindow?: VolumeWindow
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>) => {
  const { dataList, mergedData } = useMemo(() => cleanData(data, 0), [data])

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
  const yAxisColor = 'rgba(255,255,255,0.0)'
  const xAxisColor = 'rgba(255,255,255,0.1)' //'#666'

  return (
    <Wrapper {...rest} height={height}>
      <RowBetween style={{ alignItems: 'flex-start' }}>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={mergedData}
          margin={{ top: 10, right: 3, left: 3, bottom: 0 }}
          onMouseLeave={() => {
            onHoverData?.(undefined)
          }}
        >
          <CartesianGrid horizontal vertical={false} stroke={gridLineColor} strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={(time) => dayjs.unix(time).format(activeWindow === VolumeWindow.monthly ? 'MMM' : 'MMM D')}
            minTickGap={10}
            axisLine={{ stroke: xAxisColor }}
            tickLine={{ stroke: xAxisColor }}
          />
          <YAxis
            orientation="right"
            tickFormatter={(value) => formatDollarAmount(value)}
            axisLine={{ stroke: yAxisColor }}
            tickLine={{ stroke: yAxisColor }}
          />
          <Tooltip
            cursor={{ fill: theme.bg2 }}
            contentStyle={{ display: 'none' }}
            formatter={(value: number, name: string, props_: { payload: MergedTimeSeriesDatum }) => {
              onHoverData?.(props_.payload)
            }}
          />

          {dataList.map((_, i) => (
            <Bar
              key={i}
              stackId="1"
              dataKey={(datum: MergedTimeSeriesDatum) => datum.values[i]}
              fill={transparentize(0.0, colors[i % colors.length])}
              // shape={(props_: { x: number; y: number; width: number; height: number }) => (
              //   <g>
              //     <rect
              //       x={props_.x}
              //       y={props_.y}
              //       width={props_.width}
              //       height={props_.height}
              //       fill={transparentize(0.2, colors[i % colors.length])}
              //       rx="0"
              //     />
              //   </g>
              // )}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
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
