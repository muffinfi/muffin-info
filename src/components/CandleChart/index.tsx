import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import { createChart, CrosshairMode, IChartApi } from 'lightweight-charts'
import React, { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components/macro'

dayjs.extend(utc)

const Wrapper = styled(Card)`
  width: 100%;
  padding: 3px;
  display: flex;
  background-color: ${({ theme }) => theme.bg0};
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

const DEFAULT_HEIGHT = 300

export type LineChartProps = {
  data: any[]
  color?: string | undefined
  height?: number | undefined
  minHeight?: number
  setValue?: Dispatch<SetStateAction<number | undefined>> // used for value on hover
  setLabel?: Dispatch<SetStateAction<string | undefined>> // used for value label on hover
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const CandleChart = ({
  data,
  color = '#56B2A4',
  setValue,
  setLabel,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  height = DEFAULT_HEIGHT,
  minHeight = DEFAULT_HEIGHT,
  ...rest
}: LineChartProps) => {
  const theme = useTheme()
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartCreated, setChart] = useState<IChartApi | undefined>()

  const handleResize = useCallback(() => {
    if (chartCreated && chartRef?.current?.parentElement) {
      chartCreated.resize(chartRef.current.parentElement.clientWidth - 0, height)
      chartCreated.timeScale().fitContent()
      chartCreated.timeScale().scrollToPosition(0, false)
    }
  }, [chartCreated, chartRef, height])

  // add event listener for resize
  const isClient = typeof window === 'object'
  useEffect(() => {
    if (!isClient) {
      return
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient, chartRef, handleResize]) // Empty array ensures that effect is only run on mount and unmount

  // if chart not instantiated in canvas, create it
  useEffect(() => {
    if (!chartCreated && data && !!chartRef?.current?.parentElement) {
      const chart = createChart(chartRef.current, {
        height: height,
        width: chartRef.current.parentElement.clientWidth - 0,
        layout: {
          backgroundColor: 'transparent',
          textColor: '#666',
          fontFamily: 'Inter var',
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          borderVisible: true,
          borderColor: 'rgba(255,255,255,0.20)',
        },
        timeScale: {
          borderVisible: true,
          borderColor: 'rgba(255,255,255,0.20)',

          timeVisible: true,
          // secondsVisible: true,
          // tickMarkFormatter: (unixTime: number) => {
          //   return dayjs.unix(unixTime).format('MM/DD h:mm A')
          // },
        },
        watermark: {
          visible: false,
        },
        grid: {
          horzLines: {
            visible: true,
            color: 'rgba(255,255,255,0.05)',
          },
          vertLines: {
            visible: true,
            color: 'rgba(255,255,255,0.05)',
          },
        },
        crosshair: {
          horzLine: {
            visible: true,
            labelVisible: true,
            style: 3,
            width: 1,
            color: 'rgba(255,255,255,0.30)',
            labelBackgroundColor: color,
          },
          mode: CrosshairMode.Magnet,
          vertLine: {
            visible: true,
            labelVisible: false,
            style: 3,
            width: 1,
            color: 'rgba(255,255,255,0.30)',
            labelBackgroundColor: color,
          },
        },
      })

      chart.timeScale().fitContent()
      setChart(chart)
    }
  }, [color, chartCreated, data, height, setValue, theme])

  useEffect(() => {
    if (chartCreated && data) {
      const series = chartCreated.addCandlestickSeries({
        upColor: 'green',
        downColor: 'red',
        borderDownColor: 'red',
        borderUpColor: 'green',
        wickDownColor: 'red',
        wickUpColor: 'green',
      })

      series.setData(data)

      // update the title when hovering on the chart
      chartCreated.subscribeCrosshairMove(function (param) {
        if (
          chartRef?.current &&
          (param === undefined ||
            param.time === undefined ||
            (param && param.point && param.point.x < 0) ||
            (param && param.point && param.point.x > chartRef.current.clientWidth) ||
            (param && param.point && param.point.y < 0) ||
            (param && param.point && param.point.y > height))
        ) {
          // reset values
          setValue && setValue(undefined)
          setLabel && setLabel(undefined)
        } else if (series && param) {
          const timestamp = param.time as number
          const time = dayjs.unix(timestamp).utc().format('MMM D, YYYY h:mm A') + ' (UTC)'
          const parsed = param.seriesPrices.get(series) as { open: number } | undefined
          setValue && setValue(parsed?.open)
          setLabel && setLabel(time)
        }
      })
    }
  }, [chartCreated, color, data, height, setValue, setLabel, theme.bg0])

  return (
    <Wrapper minHeight={minHeight}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      <div ref={chartRef} id={'candle-chart'} {...rest} />
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default CandleChart
