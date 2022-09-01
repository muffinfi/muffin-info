import { echarts, ReactEChartsCore } from './utils'

import { Token } from '@uniswap/sdk-core'
import { mergeTimeSeriesData } from 'components/charts2/utils'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { TickProcessed } from 'data/tiers/tickData'
import useTheme from 'hooks/useTheme'
import React, { useCallback, useMemo, useRef } from 'react'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useTierDatas, useTierTickDataList } from 'state/tiers/hooks'
import { TierData, TierKey } from 'state/tiers/reducer'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { isAddress } from 'utils'
import { CurrentPriceLabel } from './CurrentPriceLabel'
import { DensityChartTooltipElement } from './DensityChartTooltipElement'

const LIQUIDITY_SUPPORTED_CHAIN_ID: number[] = []

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

export default function DensityChart({ tierKeys, isToken0Base }: { tierKeys: TierKey[]; isToken0Base: boolean }) {
  const [activeNetwork] = useActiveNetworkVersion()

  const isNetworkSupport = useMemo(() => LIQUIDITY_SUPPORTED_CHAIN_ID.includes(activeNetwork.id), [activeNetwork.id])

  const theme = useTheme()
  const colors = useMemo(() => [theme.blue1, theme.yellow3, theme.red1, theme.green1, theme.pink1, theme.yellow2], [
    theme,
  ])

  const tooltipRef = useRef<DensityChartTooltipElement>()

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
    const isSingleTier = tickDataList.length === 1
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
            itemStyle: isActive && isSingleTier ? { color: theme.pink1 } : undefined,
          },
        }
      })
    })
    return { formattedData: mergeTimeSeriesData(formattedDatas, isToken0Base), currentPrices }
  }, [loading, error, tickDataList, isToken0Base, theme.pink1])

  const centerIndex = useMemo(
    () => formattedData?.findIndex(({ metadatas }) => metadatas?.findIndex((data) => data?.isActive) > -1),
    [formattedData]
  )

  const priceFormatter = useCallback(
    (tickIdx: string | number) => {
      if (!token0?.decimals || !token1?.decimals) return ''

      const price0 = 1.0001 ** +tickIdx * 10 ** (token0.decimals - token1.decimals)
      const price = isToken0Base ? price0 : 1 / price0

      if (price < 0.00001) return price.toExponential(5)
      if (price < 0.0001) return price.toLocaleString(undefined, { maximumSignificantDigits: 2 })
      if (price < 0.001) return price.toLocaleString(undefined, { maximumSignificantDigits: 3 })
      if (price < 0.01) return price.toLocaleString(undefined, { maximumSignificantDigits: 4 })
      if (price < 10_000) return price.toLocaleString(undefined, { maximumSignificantDigits: 5 })
      if (price < 1_000_000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 })
      return price.toExponential(5)
    },
    [token0, token1, isToken0Base]
  )

  const option = useMemo(
    () =>
      !formattedData || centerIndex == null
        ? {}
        : {
            color: colors,
            grid: {
              top: 24,
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
                  formatter: ({ value }: { value: string }) => priceFormatter(value),
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
                  tickSpacing: firstTierData?.pool.tickSpacing,
                  // activeTickIdx: currentPriceData.tickIdx,
                  // liquidityActive: currentPriceData.liquidityActive,
                })
                return tooltipRef.current.render()
              },
            },
            dataZoom: [
              {
                type: 'slider',
                showDetail: false,
                left: 2,
                right: 8,
                borderColor: 'transparent',
                ...(tickDataList.length > 1 ? undefined : { startValue: centerIndex - 15, endValue: centerIndex + 15 }),
              },
            ],
            xAxis: {
              data: formattedData.map(({ time }) => time),
              axisLabel: { formatter: priceFormatter },
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
              data: formattedData.map(({ time, values, metadatas }) => ({
                name: time,
                value: values[i],
                itemStyle: metadatas[i]?.itemStyle,
                emphasis: {
                  focus: 'series',
                },
              })),
              type: 'bar',
              stack: 'x',
              large: formattedData.length > 100,
            })),
          },
    [centerIndex, colors, firstTierData?.pool.tickSpacing, formattedData, priceFormatter, tickDataList, token0, token1]
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
          <Wrapper>
            {/* TODO: resize the chart */}
            <ReactEChartsCore
              style={{ height: 400 }}
              echarts={echarts}
              option={option}
              notMerge
              lazyUpdate
              opts={{
                height: 400,
              }}
            />
          </Wrapper>
          <CurrentPriceRow>
            {currentPrices?.map((currentPrice, i) => (
              <CurrentPriceLabel
                key={i}
                token0={token0}
                token1={token1}
                price0={currentPrice.price0}
                price1={currentPrice.price1}
                feeTier={currentPrices.length === 1 ? undefined : tierDatas[i].feeTier}
                color={currentPrices.length === 1 ? theme.pink1 : colors[i % colors.length]}
              />
            ))}
          </CurrentPriceRow>
        </AutoColumn>
      )}
    </>
  )
}
