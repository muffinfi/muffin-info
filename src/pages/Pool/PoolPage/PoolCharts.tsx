import { DarkGreyCard } from 'components/Card'
import BarChart from 'components/charts2/BarChart'
import ChartLabel, { useHandleHoverData } from 'components/charts2/ChartLabel'
import LineChart from 'components/charts2/LineChart'
import { TimeSeriesDatum } from 'components/charts2/types'
import Loader from 'components/Loader'
import React, { useMemo } from 'react'
import { usePoolChartData } from 'state/pools/hooks'
import styled from 'styled-components/macro'

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

export default function PoolCharts3({ poolId, color }: { poolId: string; color: string }) {
  const chartData = usePoolChartData(poolId)

  const { formattedTvlData, formattedVolumeData, formattedFeesUSD } = useMemo(() => {
    const formattedTvlData: TimeSeriesDatum[] = []
    const formattedVolumeData: TimeSeriesDatum[] = []
    const formattedFeesUSD: TimeSeriesDatum[] = []

    if (!chartData) return { formattedTvlData, formattedVolumeData, formattedFeesUSD }

    chartData.forEach((day) => {
      formattedTvlData.push({ time: day.date, value: day.totalValueLockedUSD })
      formattedVolumeData.push({ time: day.date, value: day.volumeUSD })
      formattedFeesUSD.push({ time: day.date, value: day.feesUSD })
    })
    return { formattedTvlData, formattedVolumeData, formattedFeesUSD }
  }, [chartData])

  const tvlHandler = useHandleHoverData(formattedTvlData[formattedTvlData.length - 1])
  const volumeHandler = useHandleHoverData(formattedVolumeData[formattedVolumeData.length - 1])
  const feesHandler = useHandleHoverData(formattedFeesUSD[formattedFeesUSD.length - 1])

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
        <BarChart data={formattedVolumeData} color={color} height={280} onHoverData={volumeHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        TVL
        <ChartLabel value={tvlHandler.value} valueUnit={'USD'} valueLabel={tvlHandler.valueLabel} />
        <LineChart data={formattedTvlData} color={color} height={280} onHoverData={tvlHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        Fees 24h
        <ChartLabel value={feesHandler.value} valueUnit={'USD'} valueLabel={feesHandler.valueLabel} />
        <BarChart data={formattedFeesUSD} color={color} height={280} onHoverData={feesHandler.handleHoverData} />
      </DarkGreyCard>

      {/* <WideDarkGreyCard>
        Liquidity
        <DensityChart tierKey={tierKey} />
      </WideDarkGreyCard> */}
    </Layout>
  )
}
