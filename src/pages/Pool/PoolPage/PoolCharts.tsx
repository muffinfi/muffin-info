import { SmallOptionButton } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import BarChart from 'components/charts2/BarChart'
import ChartLabel, { useHandleHoverData } from 'components/charts2/ChartLabel'
import LineChart from 'components/charts2/LineChart'
import { TimeSeriesDatum, TimeSeriesHoverHandler } from 'components/charts2/types'
import { AutoColumn } from 'components/Column'
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

// const WideDarkGreyCard = styled(DarkGreyCard)`
//   grid-column-end: span 2;
//   ${({ theme }) => theme.mediaWidth.upToSmall`
//     grid-column-end: span 1;
//   `};
// `

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
  const tierKeys = useMemo(() => poolData?.tiers.map((t) => normalizeKey([poolData.poolId, t.tierId])), [poolData])
  const { loading, chartDataList } = useTierChartDataList(tierKeys)

  const [isToken0Base, toggleBase] = useToggle(true)

  const {
    formattedTvlDataList,
    formattedVolumeDataList,
    formattedFeesDataList,
    formattedPriceDataList,
  } = useMemo(() => {
    const formattedTvlDataList: TimeSeriesDatum[][] = []
    const formattedVolumeDataList: TimeSeriesDatum[][] = []
    const formattedFeesDataList: TimeSeriesDatum[][] = []
    const formattedPriceDataList: TimeSeriesDatum[][] = []

    chartDataList.forEach((tierChartData) => {
      formattedTvlDataList.push(tierChartData?.map((day) => ({ time: day.date, value: day.totalValueLockedUSD })) ?? [])
      formattedVolumeDataList.push(tierChartData?.map((day) => ({ time: day.date, value: day.volumeUSD })) ?? [])
      formattedFeesDataList.push(tierChartData?.map((day) => ({ time: day.date, value: day.feesUSD })) ?? [])
      formattedPriceDataList.push(
        tierChartData?.map((day) => ({
          time: day.date,
          value: isToken0Base ? day.token1Price : day.token0Price,
          metadata: day.volumeUSD,
        })) ?? []
      )
    })

    return { formattedTvlDataList, formattedVolumeDataList, formattedFeesDataList, formattedPriceDataList }
  }, [chartDataList, isToken0Base])

  const tvlHandler2 = useHandleHoverData(sumLastValues(formattedTvlDataList))
  const volumeHandler2 = useHandleHoverData(sumLastValues(formattedVolumeDataList))
  const feesHandler2 = useHandleHoverData(sumLastValues(formattedFeesDataList))
  const priceHandler2 = useHandleHoverPriceData(formattedPriceDataList)

  const feeTierPercents = useMemo(() => poolData?.tiers.map((tier) => feeTierPercent(tier.feeTier)), [poolData])

  const symbolBase = isToken0Base ? poolData.token0.symbol : poolData.token1.symbol
  const symbolQuote = isToken0Base ? poolData.token1.symbol : poolData.token0.symbol

  if (loading || chartDataList.some((chartData) => chartData == null))
    return (
      <DarkGreyCard>
        <Loader />
      </DarkGreyCard>
    )

  return (
    <Layout>
      <DarkGreyCard>
        Volume 24
        <ChartLabel value={volumeHandler2.value} valueUnit={'USD'} valueLabel={volumeHandler2.valueLabel} />
        <BarChart
          height={270}
          data={formattedVolumeDataList}
          labels={feeTierPercents}
          onHoverData={volumeHandler2.handleHoverData}
        />
      </DarkGreyCard>

      <DarkGreyCard>
        TVL
        <ChartLabel value={tvlHandler2.value} valueUnit={'USD'} valueLabel={tvlHandler2.valueLabel} />
        <LineChart
          height={270}
          data={formattedTvlDataList}
          labels={feeTierPercents}
          onHoverData={tvlHandler2.handleHoverData}
        />
      </DarkGreyCard>

      <DarkGreyCard>
        Fees 24h
        <ChartLabel value={feesHandler2.value} valueUnit={'USD'} valueLabel={feesHandler2.valueLabel} />
        <BarChart
          height={270}
          data={formattedFeesDataList}
          labels={feeTierPercents}
          onHoverData={feesHandler2.handleHoverData}
        />
      </DarkGreyCard>

      <DarkGreyCard>
        <RowBetween align="flex-start">
          <AutoColumn>
            <span>
              Price of 1 {symbolBase} <span style={{ color: '#666' }}>of the most traded tier</span>
            </span>
            <ChartLabel
              value={priceHandler2.value}
              valueUnit={symbolQuote}
              valueLabel={priceHandler2.valueLabel}
              isDollar={false}
            />
          </AutoColumn>
          <SmallOptionButton onClick={toggleBase}>Use {symbolQuote} as base</SmallOptionButton>
        </RowBetween>
        <LineChart
          height={270}
          data={formattedPriceDataList}
          labels={feeTierPercents}
          onHoverData={priceHandler2.handleHoverData}
          stack={false}
          fillMissingValueWithZero={false}
        />
      </DarkGreyCard>

      {/* <WideDarkGreyCard>
        Liquidity
        <DensityChart tierKey={tierKey} />
      </WideDarkGreyCard> */}
    </Layout>
  )
}
