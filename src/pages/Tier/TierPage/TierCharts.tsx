import { SmallOptionButton } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import BarChart from 'components/charts2/BarChart'
import ChartLabel, { useHandleHoverData } from 'components/charts2/ChartLabel'
import LineChart from 'components/charts2/LineChart'
import { TimeSeriesDatum } from 'components/charts2/types'
import { AutoColumn } from 'components/Column'
import DensityChart from 'components/echarts/DensityChart'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import { ArbitrumNetworkInfo, NetworkInfo } from 'constants/networks'
import useToggle from 'hooks/useToggle'
import React, { useMemo } from 'react'
import { useTierChartData } from 'state/tiers/hooks'
import { TierData } from 'state/tiers/reducer'
import styled from 'styled-components/macro'

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

interface TierChartsProps {
  tierKey: string
  color: string
  activeNetwork: NetworkInfo
  tierData: TierData
}

export default function TierCharts({ tierKey, color, activeNetwork, tierData }: TierChartsProps) {
  const chartData = useTierChartData(tierKey)
  const tierKeys = useMemo(() => [tierKey], [tierKey])

  // chart data
  const { tvlData, volumeData, feesUSD } = useMemo(() => {
    const tvlData: TimeSeriesDatum[] = []
    const volumeData: TimeSeriesDatum[] = []
    const feesUSD: TimeSeriesDatum[] = []
    if (chartData) {
      chartData.forEach((day) => {
        tvlData.push({
          time: day.date,
          value: day.totalValueLockedUSD,
        })
        volumeData.push({
          time: day.date,
          value: day.volumeUSD,
        })
        feesUSD.push({
          time: day.date,
          value: day.feesUSD,
        })
      })
    }
    return { tvlData, volumeData, feesUSD }
  }, [chartData])

  // price data
  const [isToken0Base, toggleBase] = useToggle(true)
  const priceData = useMemo(() => {
    const priceData: TimeSeriesDatum[] = []
    if (chartData) {
      chartData.forEach((day) => {
        priceData.push({
          time: day.date,
          value: isToken0Base ? day.token1Price : day.token0Price,
        })
      })
    }
    return priceData
  }, [chartData, isToken0Base])

  const symbolBase = isToken0Base ? tierData.pool.token0.symbol : tierData.pool.token1.symbol
  const symbolQuote = isToken0Base ? tierData.pool.token1.symbol : tierData.pool.token0.symbol

  // chart label setters
  const tvlHandler = useHandleHoverData(tvlData[tvlData.length - 1]?.value)
  const volumeHandler = useHandleHoverData(volumeData[volumeData.length - 1]?.value)
  const feesHandler = useHandleHoverData(feesUSD[feesUSD.length - 1]?.value)
  const priceHandler = useHandleHoverData(priceData[priceData.length - 1]?.value)

  if (chartData == null)
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
        <BarChart data={volumeData} color={color} height={270} onHoverData={volumeHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        TVL
        <ChartLabel value={tvlHandler.value} valueUnit={'USD'} valueLabel={tvlHandler.valueLabel} />
        <LineChart data={tvlData} color={color} height={270} onHoverData={tvlHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        Fees (Daily)
        <ChartLabel value={feesHandler.value} valueUnit={'USD'} valueLabel={feesHandler.valueLabel} />
        <BarChart data={feesUSD} color={color} height={270} onHoverData={feesHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        <RowBetween align="flex-start">
          <AutoColumn>
            Price of 1 {symbolBase}
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
          data={priceData}
          isDollar={false}
          color={color}
          height={270}
          onHoverData={priceHandler.handleHoverData}
        />
      </DarkGreyCard>

      {activeNetwork === ArbitrumNetworkInfo ? null : (
        <WideDarkGreyCard>
          <RowBetween align="flex-start">
            Liquidity
            <SmallOptionButton onClick={toggleBase}>Use {symbolQuote} as base</SmallOptionButton>
          </RowBetween>
          <DensityChart tierKeys={tierKeys} isToken0Base={isToken0Base} />
        </WideDarkGreyCard>
      )}
    </Layout>
  )
}
