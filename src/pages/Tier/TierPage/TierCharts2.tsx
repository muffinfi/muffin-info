import { DarkGreyCard } from 'components/Card'
import BarChart from 'components/charts/base/BarChart'
import Chart from 'components/charts/base/Chart'
import LineChart from 'components/charts/base/LineChart'
import { AutoColumn } from 'components/Column'
import DensityChart from 'components/DensityChart/alt'
import Loader from 'components/Loader'
import { MonoSpace } from 'components/shared'
import { NetworkInfo } from 'constants/networks'
import { HistogramData, isUTCTimestamp, SingleValueData } from 'lightweight-charts'
import React, { useCallback, useMemo, useState } from 'react'
import { SeriesHoverDataHandler } from 'react-lightweight-charts-simple'
import { useTierChartData } from 'state/tiers/hooks'
import { TierData } from 'state/tiers/reducer'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

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

const ChartLabel = ({
  value,
  valueUnit,
  valueLabel,
}: {
  value: number | undefined
  valueUnit: string | undefined
  valueLabel: string | undefined
}) => {
  return (
    <AutoColumn>
      <TYPE.label fontSize="24px" minHeight="30px">
        <MonoSpace>
          {value != null ? formatDollarAmount(value) : ''} {valueUnit}
        </MonoSpace>
      </TYPE.label>
      <TYPE.main minHeight="20px" fontSize="12px">
        {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : ''}
      </TYPE.main>
    </AutoColumn>
  )
}

const useHandleHoverData = (defaultData?: SingleValueData | undefined) => {
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()

  const handleHoverData: SeriesHoverDataHandler = useCallback((value, event) => {
    setLatestValue(value as number)
    setValueLabel(event.time && isUTCTimestamp(event.time) ? unixToDate(event.time, 'MMM D, YYYY') : '')
  }, [])

  const value = latestValue ?? defaultData?.value

  return { value, valueLabel, handleHoverData }
}

interface TierChartsProps {
  tierKey: string
  color: string
  activeNetwork: NetworkInfo
  tierData: TierData
}

// const CANDLESTICK_SERIES_OPTIONS: DeepPartial<CandlestickSeriesOptions> = {
//   upColor: 'green',
//   downColor: 'red',
//   borderDownColor: 'red',
//   borderUpColor: 'green',
//   wickDownColor: 'red',
//   wickUpColor: 'green',
// }

export default function TierCharts2({ tierKey, color, activeNetwork, tierData }: TierChartsProps) {
  const chartData = useTierChartData(tierKey)

  const { formattedTvlData, formattedVolumeData, formattedFeesUSD, formattedPrice0 } = useMemo(() => {
    const formattedTvlData: SingleValueData[] = []
    const formattedVolumeData: HistogramData[] = []
    const formattedFeesUSD: HistogramData[] = []
    const formattedPrice0: SingleValueData[] = []
    if (!chartData) return { formattedTvlData, formattedVolumeData, formattedFeesUSD, formattedPrice0 }

    chartData.forEach((day) => {
      formattedTvlData.push({
        time: day.date,
        value: day.totalValueLockedUSD,
      } as SingleValueData)

      formattedVolumeData.push({
        time: day.date,
        value: day.volumeUSD,
      } as HistogramData)

      formattedFeesUSD.push({
        time: day.date,
        value: day.feesUSD,
      } as HistogramData)

      formattedPrice0.push({
        time: day.date,
        // open: day.open,
        // high: day.high,
        // low: day.low,
        // close: day.close,
        value: day.token0Price,
      } as SingleValueData)
    })
    return { formattedTvlData, formattedVolumeData, formattedFeesUSD, formattedPrice0 }
  }, [chartData])

  const priceHandler = useHandleHoverData(formattedPrice0[formattedPrice0.length - 1])
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
        Price
        <ChartLabel
          value={priceHandler.value}
          valueUnit={tierData.pool.token0.symbol}
          valueLabel={priceHandler.valueLabel}
        />
        <Chart height={250} disableScroll autoFitDeps={[formattedPrice0]}>
          <LineChart data={formattedPrice0} color={color} onHoverData={priceHandler.handleHoverData} />
        </Chart>
      </DarkGreyCard>

      <DarkGreyCard>
        TVL
        <ChartLabel value={tvlHandler.value} valueUnit={'USD'} valueLabel={tvlHandler.valueLabel} />
        <Chart height={250} disableScroll autoFitDeps={[formattedTvlData]}>
          <LineChart data={formattedTvlData} color={color} onHoverData={tvlHandler.handleHoverData} />
        </Chart>
      </DarkGreyCard>

      <DarkGreyCard>
        Volume
        <ChartLabel value={volumeHandler.value} valueUnit={'USD'} valueLabel={volumeHandler.valueLabel} />
        <Chart height={250} disableScroll autoFitDeps={[formattedVolumeData]}>
          <BarChart data={formattedVolumeData} color={color} onHoverData={volumeHandler.handleHoverData} />
        </Chart>
      </DarkGreyCard>

      <DarkGreyCard>
        Fees
        <ChartLabel value={feesHandler.value} valueUnit={'USD'} valueLabel={feesHandler.valueLabel} />
        <Chart height={250} disableScroll autoFitDeps={[formattedFeesUSD]}>
          <BarChart data={formattedFeesUSD} color={color} onHoverData={feesHandler.handleHoverData} />
        </Chart>
      </DarkGreyCard>

      <WideDarkGreyCard>
        Liquidity
        <DensityChart tierKey={tierKey} />
      </WideDarkGreyCard>
    </Layout>
  )
}
