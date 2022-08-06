import { SmallOptionButton } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import BarChart2 from 'components/charts2/BarChart2'
import ChartLabel, { useHandleHoverData2 } from 'components/charts2/ChartLabel'
import LineChart2 from 'components/charts2/LineChart2'
import { TimeSeriesDatum } from 'components/charts2/types'
import { AutoColumn } from 'components/Column'
import DensityChart from 'components/DensityChart/alt'
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

  const { formattedTvlData, formattedVolumeData, formattedFeesUSD } = useMemo(() => {
    const formattedTvlData: TimeSeriesDatum[] = []
    const formattedVolumeData: TimeSeriesDatum[] = []
    const formattedFeesUSD: TimeSeriesDatum[] = []
    if (chartData) {
      chartData.forEach((day) => {
        formattedTvlData.push({ time: day.date, value: day.totalValueLockedUSD })
        formattedVolumeData.push({ time: day.date, value: day.volumeUSD })
        formattedFeesUSD.push({ time: day.date, value: day.feesUSD })
      })
    }
    return { formattedTvlData, formattedVolumeData, formattedFeesUSD }
  }, [chartData])

  // price data
  const [isToken0Base, toggleBase] = useToggle(true)
  const formattedPriceData = useMemo(() => {
    const formattedPriceData: TimeSeriesDatum[] = []
    if (chartData) {
      chartData.forEach((day) => {
        formattedPriceData.push({
          time: day.date,
          value: isToken0Base ? day.token1Price : day.token0Price,
        })
      })
    }
    return formattedPriceData
  }, [chartData, isToken0Base])

  const symbolBase = isToken0Base ? tierData.pool.token0.symbol : tierData.pool.token1.symbol
  const symbolQuote = isToken0Base ? tierData.pool.token1.symbol : tierData.pool.token0.symbol

  const tvlHandler = useHandleHoverData2(formattedTvlData[formattedTvlData.length - 1]?.value)
  const volumeHandler = useHandleHoverData2(formattedVolumeData[formattedVolumeData.length - 1]?.value)
  const feesHandler = useHandleHoverData2(formattedFeesUSD[formattedFeesUSD.length - 1]?.value)
  const priceHandler = useHandleHoverData2(formattedPriceData[formattedPriceData.length - 1]?.value)

  if (chartData == null)
    return (
      <DarkGreyCard>
        <Loader />
      </DarkGreyCard>
    )

  return (
    <Layout>
      <DarkGreyCard>
        Volume 24h
        <ChartLabel value={volumeHandler.value} valueUnit={'USD'} valueLabel={volumeHandler.valueLabel} />
        <BarChart2 data={formattedVolumeData} color={color} height={280} onHoverData={volumeHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        TVL
        <ChartLabel value={tvlHandler.value} valueUnit={'USD'} valueLabel={tvlHandler.valueLabel} />
        <LineChart2 data={formattedTvlData} color={color} height={280} onHoverData={tvlHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        Fees 24h
        <ChartLabel value={feesHandler.value} valueUnit={'USD'} valueLabel={feesHandler.valueLabel} />
        <BarChart2 data={formattedFeesUSD} color={color} height={280} onHoverData={feesHandler.handleHoverData} />
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
        <LineChart2
          data={formattedPriceData}
          isDollar={false}
          color={color}
          height={280}
          onHoverData={priceHandler.handleHoverData}
        />
      </DarkGreyCard>

      {activeNetwork === ArbitrumNetworkInfo ? null : (
        <WideDarkGreyCard>
          Liquidity
          <DensityChart tierKey={tierKey} />
        </WideDarkGreyCard>
      )}
    </Layout>
  )
}
