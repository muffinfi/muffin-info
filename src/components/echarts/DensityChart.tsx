import { echarts, ReactEChartsCore } from './utils'

import { SupportedChainId } from '@muffinfi/muffin-sdk'
import { Token } from '@uniswap/sdk-core'
import { mergeTimeSeriesData } from 'components/charts2/utils'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { TickProcessed } from 'data/tiers/tickData'
import { EChartsInstance } from 'echarts-for-react'
import useTheme from 'hooks/useTheme'
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useTierDatas, useTierTickDataList } from 'state/tiers/hooks'
import { TierData, TierKey } from 'state/tiers/reducer'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { isAddress } from 'utils'
import { CurrentPriceLabel } from './CurrentPriceLabel'
import { DensityChartTooltipElement } from './DensityChartTooltipElement'

const LIQUIDITY_UNSUPPORTED_CHAIN_ID: SupportedChainId[] = [SupportedChainId.RINKEBY]

const priceFormatter = (price?: number) => {
  if (price == null) return ''
  if (price < 0.00001) return price.toExponential(5)
  if (price < 0.0001) return price.toLocaleString(undefined, { maximumSignificantDigits: 2 })
  if (price < 0.001) return price.toLocaleString(undefined, { maximumSignificantDigits: 3 })
  if (price < 0.01) return price.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  if (price < 10_000) return price.toLocaleString(undefined, { maximumSignificantDigits: 5 })
  if (price < 1_000_000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return price.toExponential(5)
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
`

const CurrentPriceRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
`

const CHART_STYLE = { height: 400 }

export default function DensityChart({ tierKeys, isToken0Base }: { tierKeys: TierKey[]; isToken0Base: boolean }) {
  const [activeNetwork] = useActiveNetworkVersion()

  const isNetworkSupport = useMemo(
    () => !LIQUIDITY_UNSUPPORTED_CHAIN_ID.includes((activeNetwork.id as unknown) as SupportedChainId),
    [activeNetwork.id]
  )

  const theme = useTheme()
  const colors = useMemo(() => [theme.blue1, theme.yellow3, theme.red1, theme.green1, theme.pink1, theme.yellow2], [
    theme,
  ])

  const [echartsInstance, setEchartsInstance] = useState<EChartsInstance>()
  const tooltipRef = useRef<DensityChartTooltipElement>()
  const wrapperRef = useRef<HTMLDivElement>()

  // poolData
  const tierDatas = useTierDatas(isNetworkSupport ? tierKeys : undefined)
  const firstTierData = tierDatas[0] as TierData | undefined
  const formattedAddress0 = isAddress(firstTierData?.pool.token0.address)
  const formattedAddress1 = isAddress(firstTierData?.pool.token1.address)

  // parsed tokens
  const token0 = useMemo(() => {
    return firstTierData && formattedAddress0 && formattedAddress1
      ? new Token(
          1,
          formattedAddress0,
          firstTierData.pool.token0.decimals,
          firstTierData.pool.token0.symbol,
          firstTierData.pool.token0.name
        )
      : undefined
  }, [formattedAddress0, formattedAddress1, firstTierData])

  const token1 = useMemo(() => {
    return firstTierData && formattedAddress1 && formattedAddress1
      ? new Token(
          1,
          formattedAddress1,
          firstTierData.pool.token1.decimals,
          firstTierData.pool.token1.symbol,
          firstTierData.pool.token1.name
        )
      : undefined
  }, [formattedAddress1, firstTierData])

  // tick data tracking
  const { loading, tickDataList, error } = useTierTickDataList(isNetworkSupport ? tierKeys : undefined)
  const { formattedData, currentPrices } = useMemo(() => {
    if (loading || error) return {}
    const currentPrices: TickProcessed[] = new Array(tickDataList.length)
    const formattedDatas = tickDataList.map((tickData, i) => {
      if (!tickData) return []
      const ticks: TickProcessed[] = isToken0Base ? tickData.ticksProcessed : [...tickData.ticksProcessed].reverse()
      return ticks.map((t) => {
        if (t.tickIdx === tickData.activeTickIdx) {
          currentPrices[i] = t
        }
        const liquidityActive = parseFloat(t.liquidityActive.toString())
        const isActive = t.tickIdx === tickData.activeTickIdx
        return {
          time: t.tickIdx,
          value: liquidityActive,
          metadata: {
            tick: t,
            isActive,
          },
        }
      })
    })
    const formattedData = mergeTimeSeriesData(formattedDatas, isToken0Base, 0)
    return formattedData.length ? { formattedData, currentPrices } : {}
  }, [loading, error, tickDataList, isToken0Base])

  const getPrice = useCallback(
    (tickIdx: string | number) => {
      if (!token0?.decimals || !token1?.decimals) return undefined
      const price0 = 1.0001 ** +tickIdx * 10 ** (token0.decimals - token1.decimals)
      return isToken0Base ? price0 : 1 / price0
    },
    [token0?.decimals, token1?.decimals, isToken0Base]
  )

  const tickIdxFormatter = useCallback((tickIdx: string | number) => priceFormatter(getPrice(tickIdx)), [getPrice])

  const tickSpacing = firstTierData?.pool.tickSpacing ?? 100
  const initialZoom = useMemo(() => {
    if (!formattedData) return undefined

    const [min, max] = formattedData.reduce(
      ([min, max], { metadatas }, i) => {
        const isActive = metadatas?.findIndex((data) => data?.isActive) > -1
        if (isActive) {
          if (min === -1) min = i
          max = i
        }
        return [min, max]
      },
      [-1, -1] as [number, number]
    )

    const centerIndex = Math.floor((min + max) / 2)
    const zoomPadding = Math.max(tickSpacing * 3, 30)

    return { startValue: centerIndex - zoomPadding, endValue: centerIndex + zoomPadding }
  }, [formattedData, tickSpacing])

  const currentPriceLabels: ([string, string] | undefined)[] | undefined = useMemo(
    () =>
      currentPrices?.map((currentPrice) => {
        const price = getPrice(currentPrice.tickIdx)
        if (!price) return undefined
        return isToken0Base
          ? [priceFormatter(price), priceFormatter(1 / price)]
          : [priceFormatter(1 / price), priceFormatter(price)]
      }),
    [currentPrices, getPrice, isToken0Base]
  )

  const option = useMemo(
    () =>
      !formattedData || !currentPrices || initialZoom == null
        ? {}
        : {
            color: colors,
            grid: {
              top: 32,
              bottom: 90,
              left: 1,
              right: 1,
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow',
                label: {
                  show: true,
                  formatter: ({ value }: { value: string }) => tickIdxFormatter(value),
                },
              },
              formatter: (params: any) => {
                if (!tooltipRef.current) {
                  tooltipRef.current = new DensityChartTooltipElement()
                }
                const data = formattedData[params[0].dataIndex]
                // const currentPriceData = data.metadatas.find((metadata) => metadata) as TickProcessed
                tooltipRef.current.update({
                  token0,
                  token1,
                  tickIdx: data.time,
                  tickSpacing,
                  // activeTickIdx: currentPriceData.tickIdx,
                  // liquidityActive: currentPriceData.liquidityActive,
                })
                return tooltipRef.current.render()
              },
            },
            dataZoom: [
              { type: 'inside', minValueSpan: Math.max(tickSpacing * 2, 10), ...initialZoom },
              {
                type: 'slider',
                showDetail: false,
                left: 2,
                right: 8,
                borderColor: 'transparent',
                ...initialZoom,
              },
            ],
            xAxis: {
              data: formattedData.map(({ time }) => time),
              axisLabel: { formatter: tickIdxFormatter },
            },
            yAxis: {
              axisLabel: {
                show: false,
              },
              splitLine: {
                lineStyle: {
                  opacity: 0.1,
                  type: 'dashed',
                },
              },
            },
            series: tickDataList.map((tickData, i) => ({
              name: tickData?.feeTier,
              type: 'bar',
              stack: 'x',
              areaStyle: {},
              emphasis: { focus: 'series' },
              data: formattedData.map(({ time, values }) => ({
                name: time,
                value: values[i],
              })),
              silent: true,
              animation: false,
              large: formattedData.length > 100,
              markLine: {
                silent: true,
                symbol: 'none',
                label: { show: false },
                data: [
                  {
                    name: 'Current Price Tick',
                    xAxis: currentPrices[i].tickIdx.toString(),
                  },
                ],
              },
            })),
          },
    [formattedData, currentPrices, colors, initialZoom, tickIdxFormatter, tickDataList, token0, token1, tickSpacing]
  )

  // reset wrapper width when parent size changed, needed to resize from larger width to smaller width,
  // otherwise wrapper keeps larger width since its children size is larger
  useEffect(() => {
    const handler = () => {
      const wrapper = wrapperRef.current
      if (!wrapper) return
      const width = wrapper.parentElement?.getBoundingClientRect().width
      wrapper.style.width = `${width}px`
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // CurrentPriceLabels
  const legends = useMemo(
    () =>
      currentPrices?.map((_, i) => (
        <CurrentPriceLabel
          key={i}
          token0={token0}
          token1={token1}
          price0={currentPriceLabels?.[i]?.[0]}
          price1={currentPriceLabels?.[i]?.[1]}
          feeTier={tierDatas[i].feeTier}
          color={colors[i % colors.length]}
          onClick={() => {
            echartsInstance.dispatchAction({
              type: 'dataZoom',
              ...initialZoom,
            })
            currentPrices.length > 1 &&
              echartsInstance.dispatchAction({
                type: 'highlight',
                seriesIndex: i,
              })
          }}
          onMouseEnter={
            currentPrices.length > 1
              ? () =>
                  echartsInstance.dispatchAction({
                    type: 'highlight',
                    seriesIndex: i,
                  })
              : undefined
          }
          onMouseLeave={
            currentPrices.length > 1
              ? () => echartsInstance.dispatchAction({ type: 'downplay', seriesIndex: i })
              : undefined
          }
        />
      )),
    [colors, currentPriceLabels, currentPrices, echartsInstance, initialZoom, tierDatas, token0, token1]
  )

  if (!isNetworkSupport) {
    return (
      <TYPE.main as="div" css={{ margin: '16px 0', fontWeight: 500, textAlign: 'center', color: theme.text2 }}>
        🚧 Under construction 🚧
      </TYPE.main>
    )
  }

  if (loading) {
    return <Loader />
  }

  return (
    <>
      {!formattedData || formattedData.length === 0 ? (
        <div>No Data</div>
      ) : (
        <AutoColumn gap="8px">
          <Wrapper ref={wrapperRef as RefObject<HTMLDivElement>}>
            <ReactEChartsCore
              style={CHART_STYLE}
              opts={CHART_STYLE}
              echarts={echarts}
              onChartReady={setEchartsInstance}
              option={option}
              notMerge
              lazyUpdate
            />
          </Wrapper>
          <CurrentPriceRow>{legends}</CurrentPriceRow>
        </AutoColumn>
      )}
    </>
  )
}
