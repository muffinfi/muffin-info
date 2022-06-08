import useTheme from 'hooks/useTheme'
import { IChartApi } from 'lightweight-charts'
import React, { DependencyList, useCallback, useMemo } from 'react'
import { Chart as BaseChart, ChartAutoResizer, ChartFitContentTrigger } from 'react-lightweight-charts-simple'

type ChartProps = {
  disableScroll?: boolean
  autoFitDeps?: DependencyList
} & Parameters<typeof BaseChart>[0]

export default function Chart({ disableScroll, autoFitDeps, options, children, ...rest }: ChartProps) {
  const theme = useTheme()

  const onResize = useCallback(
    (chart: IChartApi | undefined) => {
      if (!disableScroll) return
      chart?.timeScale().fitContent()
    },
    [disableScroll]
  )

  const mergedOptions = useMemo(
    () => ({
      height: 300,
      layout: {
        backgroundColor: 'transparent',
        textColor: theme.text2,
        fontFamily: 'Inter var',
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },

        drawTicks: false,
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      handleScroll: !(disableScroll ?? true),
      handleScale: !(disableScroll ?? true),
      ...options,
    }),
    [disableScroll, options, theme.text2]
  )

  return (
    <BaseChart options={mergedOptions} disableAutoContentFitOnInit disableAutoResize {...rest}>
      {children}
      <ChartAutoResizer onResize={onResize} />
      <ChartFitContentTrigger deps={autoFitDeps} />
    </BaseChart>
  )
}
