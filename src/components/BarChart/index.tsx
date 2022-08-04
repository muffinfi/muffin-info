import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import usePrevious from 'hooks/usePrevious'
import type { ChartOptions, DeepPartial, HistogramData, HistogramSeriesOptions, IChartApi } from 'lightweight-charts'
import React, { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef } from 'react'
import { Chart, HistogramSeries } from 'react-lightweight-charts-simple'
import styled from 'styled-components/macro'
import Card from '../Card'
dayjs.extend(utc)

const Wrapper = styled(Card)`
  width: 100%;
  padding: 1rem;
  padding-right: 2rem;
  display: flex;
  background-color: ${({ theme }) => theme.bg0}
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

const DEFAULT_HEIGHT = 300

export type LineChartProps = {
  data: HistogramData[]
  color?: string | undefined
  height?: number | undefined
  minHeight?: number
  setValue?: Dispatch<SetStateAction<number | undefined>> // used for value on hover
  setLabel?: Dispatch<SetStateAction<string | undefined>> // used for label of valye
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
  chartOptions?: DeepPartial<ChartOptions>
  seriesOptions?: DeepPartial<HistogramSeriesOptions>
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'>

const BarChart = ({
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
  chartOptions,
  seriesOptions,
  ...rest
}: LineChartProps) => {
  // const theme = useTheme()
  // const textColor = theme.text2
  const chartRef = useRef<IChartApi>()

  const dataPrev = usePrevious(data)

  const mergedChartOptions: DeepPartial<ChartOptions> = useMemo(
    () => ({
      layout: {
        backgroundColor: 'transparent',
        textColor: '#565A69',
        fontFamily: 'Inter var',
      },
      leftPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0,
        },
        // drawTicks: false,
        visible: true,
        // borderVisible: false,
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0,
        },

        drawTicks: false,
        borderVisible: false,
        visible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      watermark: {
        color: 'rgba(0, 0, 0, 0)',
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        vertLine: {
          visible: true,
          style: 3,
          width: 1,
          color: '#505050',
          labelBackgroundColor: color,
          labelVisible: false,
        },
      },
      ...chartOptions,
    }),
    [color, chartOptions]
  )

  const mergedSeriesOptions: DeepPartial<HistogramSeriesOptions> = useMemo(
    () => ({
      color,
      base: 0,
      lastValueVisible: false,
      priceLineVisible: false,
      priceScaleId: 'left',
      // priceFormat: {
      //   type: 'custom',
      //   minMove: 0.02,
      //   formatter: (price: any) => formatDollarAmount(price),
      // },
      priceFormat: {
        type: 'volume',
      },
      ...seriesOptions,
    }),
    [color, seriesOptions]
  )

  // reset on new data
  useEffect(() => {
    if (dataPrev !== data && chartRef.current) {
      chartRef.current?.resize(0, 0)
      chartRef.current?.timeScale().fitContent()
    }
  }, [data, dataPrev])

  // // for reseting value on hover exit
  // const currentValue = data[data.length - 1]?.value

  // const handleResize = useCallback(() => {
  //   if (chartCreated && chartRef?.current?.parentElement) {
  //     chartCreated.resize(chartRef.current.parentElement.clientWidth - 32, height)
  //     chartCreated.timeScale().fitContent()
  //     chartCreated.timeScale().scrollToPosition(0, false)
  //   }
  // }, [chartCreated, chartRef, height])

  // useEffect(() => {
  //   if (chartCreated && data) {
  //     const series = chartCreated.addHistogramSeries({
  //       color: color,
  //     })

  //     series.setData(data)
  //     chartCreated.timeScale().fitContent()

  //     series.applyOptions({
  //       priceFormat: {
  //         type: 'custom',
  //         minMove: 0.02,
  //         formatter: (price: any) => formatDollarAmount(price),
  //       },
  //     })

  //     // update the title when hovering on the chart
  //     chartCreated.subscribeCrosshairMove(function (param) {
  //       if (
  //         chartRef?.current &&
  //         (param === undefined ||
  //           param.time === undefined ||
  //           (param && param.point && param.point.x < 0) ||
  //           (param && param.point && param.point.x > chartRef.current.clientWidth) ||
  //           (param && param.point && param.point.y < 0) ||
  //           (param && param.point && param.point.y > height))
  //       ) {
  //         setValue && setValue(undefined)
  //         setLabel && setLabel(undefined)
  //       } else if (series && param) {
  //         const time = param?.time as { day: number; year: number; month: number }
  //         const timeString = dayjs(time.year + '-' + time.month + '-' + time.day).format('MMM D, YYYY')
  //         const price = parseFloat(param?.seriesPrices?.get(series)?.toString() ?? currentValue.toString())
  //         setValue && setValue(price)
  //         setLabel && timeString && setLabel(timeString)
  //       }
  //     })
  //   }
  // }, [chartCreated, color, currentValue, data, height, setLabel, setValue, theme.bg0])

  return (
    <Wrapper minHeight={minHeight}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      <Chart height={height} options={mergedChartOptions} id="bar-chart" {...rest}>
        <HistogramSeries data={data} options={mergedSeriesOptions} />
      </Chart>
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default BarChart
