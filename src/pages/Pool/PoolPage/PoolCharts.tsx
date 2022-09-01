import { SmallOptionButton } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import BarChart from 'components/charts2/BarChart'
import ChartLabel, { useHandleHoverData } from 'components/charts2/ChartLabel'
import LineChart from 'components/charts2/LineChart'
import { TimeSeriesDatum, TimeSeriesHoverHandler } from 'components/charts2/types'
import { AutoColumn } from 'components/Column'
import DensityChart from 'components/echarts/DensityChart'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import useToggle from 'hooks/useToggle'
import React, { useCallback, useMemo, useState } from 'react'
import { PoolData } from 'state/pools/reducer'
import { useTierChartDataList } from 'state/tiers/hooks'
import { normalizeKey } from 'state/tiers/utils'
import styled from 'styled-components/macro'
import { feeTierPercent } from 'utils'
import { unixToDate } from 'utils/date'

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `};
`

const WideDarkGreyCard = styled(DarkGreyCard)`
  grid-column-end: span 2;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-column-end: span 1;
  `};
`

const sumLastValues = (dataList: TimeSeriesDatum[][]) => {
  return dataList
    .map((data) => data[data.length - 1]?.value) //
    .reduce((acc, cur) => (acc ?? 0) + (cur ?? 0))
}

const findValueOfMaxWeight = (xs: (number | undefined)[], ws: (number | undefined)[]) => {
  let x: number | undefined
  let maxW = 0
  let i = 0
  for (; i < xs.length; i++) {
    const w = ws[i] ?? 0
    if (w >= maxW) {
      x = xs[i]
      maxW = w
    }
  }
  return { value: x, weight: maxW, index: i }
}

const useHandleHoverPriceData = (priceDataList: TimeSeriesDatum[][]) => {
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  const defaultValue = useMemo(
    () =>
      findValueOfMaxWeight(
        priceDataList.map((data) => data[data.length - 1]?.value),
        priceDataList.map((data) => data[data.length - 1]?.metadata)
      ).value,
    [priceDataList]
  )
  const value = latestValue ?? defaultValue

  const handleHoverData: TimeSeriesHoverHandler = useCallback((datum) => {
    setLatestValue(datum ? findValueOfMaxWeight(datum.values, datum.metadatas).value : undefined)
    setValueLabel(datum?.time ? unixToDate(datum.time, 'MMM D, YYYY') : '')
  }, [])

  return { value, valueLabel, handleHoverData }
}

export default function PoolCharts({ poolData }: { poolData: PoolData }) {
  const tierKeys = useMemo(() => poolData.tiers.map((t) => normalizeKey([poolData.poolId, t.tierId])), [poolData])
  const { loading, chartDataList } = useTierChartDataList(tierKeys)

  // chart data
  const { tvlDataList, volumeDataList, feesDataList } = useMemo(() => {
    const tvlDataList: TimeSeriesDatum[][] = []
    const volumeDataList: TimeSeriesDatum[][] = []
    const feesDataList: TimeSeriesDatum[][] = []

    chartDataList.forEach((tierChartData) => {
      tvlDataList.push(
        tierChartData?.map((day) => ({
          time: day.date,
          value: day.totalValueLockedUSD,
        })) ?? []
      )
      volumeDataList.push(
        tierChartData?.map((day) => ({
          time: day.date,
          value: day.volumeUSD,
        })) ?? []
      )
      feesDataList.push(
        tierChartData?.map((day) => ({
          time: day.date,
          value: day.feesUSD,
        })) ?? []
      )
    })

    return { tvlDataList, volumeDataList, feesDataList }
  }, [chartDataList])

  // price chart data
  const [isToken0Base, toggleBase] = useToggle(true)
  const priceDataList = useMemo(() => {
    const priceDataList: TimeSeriesDatum[][] = []

    chartDataList.forEach((tierChartData) => {
      priceDataList.push(
        tierChartData?.map((day) => ({
          time: day.date,
          value: isToken0Base ? day.token1Price : day.token0Price,
          metadata: day.volumeUSD,
        })) ?? []
      )
    })

    return priceDataList
  }, [chartDataList, isToken0Base])

  const symbolBase = isToken0Base ? poolData.token0.symbol : poolData.token1.symbol
  const symbolQuote = isToken0Base ? poolData.token1.symbol : poolData.token0.symbol

  // chart label setters
  const tvlHandler = useHandleHoverData(() => sumLastValues(tvlDataList))
  const volumeHandler = useHandleHoverData(() => sumLastValues(volumeDataList))
  const feesHandler = useHandleHoverData(() => sumLastValues(feesDataList))
  const priceHandler = useHandleHoverPriceData(priceDataList)

  const feePercents = useMemo(() => poolData.tiers.map((tier) => feeTierPercent(tier.feeTier)), [poolData])

  if (loading || chartDataList.some((chartData) => chartData == null))
    return (
      <DarkGreyCard>
        <Loader />
      </DarkGreyCard>
    )

  return (
    <Layout>
      <DarkGreyCard>
        Volume (Daily)
        <ChartLabel value={volumeHandler.value} valueUnit={'USD'} valueLabel={volumeHandler.valueLabel} />
        <BarChart height={270} data={volumeDataList} labels={feePercents} onHoverData={volumeHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        TVL
        <ChartLabel value={tvlHandler.value} valueUnit={'USD'} valueLabel={tvlHandler.valueLabel} />
        <LineChart height={270} data={tvlDataList} labels={feePercents} onHoverData={tvlHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        Fees (Daily)
        <ChartLabel value={feesHandler.value} valueUnit={'USD'} valueLabel={feesHandler.valueLabel} />
        <BarChart height={270} data={feesDataList} labels={feePercents} onHoverData={feesHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        <RowBetween align="flex-start">
          <AutoColumn>
            <span>
              Price of 1 {symbolBase} <span style={{ color: '#666' }}>of the most traded tier</span>
            </span>
            <ChartLabel
              value={priceHandler.value}
              valueUnit={symbolQuote}
              valueLabel={priceHandler.valueLabel}
              isDollar={false}
            />
          </AutoColumn>
          <SmallOptionButton onClick={toggleBase}>Use {symbolQuote} as base</SmallOptionButton>
        </RowBetween>
        <LineChart
          height={270}
          data={priceDataList}
          labels={feePercents}
          onHoverData={priceHandler.handleHoverData}
          stack={false}
          fillMissingValueWithZero={false}
        />
      </DarkGreyCard>

      <WideDarkGreyCard>
        <RowBetween align="flex-start">
          Liquidity
          <SmallOptionButton onClick={toggleBase}>Use {symbolQuote} as base</SmallOptionButton>
        </RowBetween>
        <DensityChart tierKeys={tierKeys} isToken0Base={isToken0Base} />
      </WideDarkGreyCard>
    </Layout>
  )
}
