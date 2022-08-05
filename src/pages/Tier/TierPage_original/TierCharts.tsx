import { DarkGreyCard } from 'components/Card'
import BarChart from 'components/charts/base/BarChart'
import Chart from 'components/charts/base/Chart'
import LineChart from 'components/charts/base/LineChart'
import { AutoColumn } from 'components/Column'
import DensityChart from 'components/DensityChart/alt'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
import { ArbitrumNetworkInfo, NetworkInfo } from 'constants/networks'
import { HistogramData, isUTCTimestamp, SingleValueData } from 'lightweight-charts'
import React, { useCallback, useMemo, useState } from 'react'
import { SeriesHoverDataHandler } from 'react-lightweight-charts-simple'
import { useTierChartData } from 'state/tiers/hooks'
import { TierData } from 'state/tiers/reducer'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

const ToggleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    row-gap: 1rem;
  `}
`

const DesktopOnly = styled.span`
  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `}
`

enum ChartView {
  TVL,
  VOL,
  PRICE,
  DENSITY,
  FEES,
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

export default function TierCharts({ tierKey, color, activeNetwork, tierData }: TierChartsProps) {
  const chartData = useTierChartData(tierKey)

  const [view, setView] = useState(ChartView.VOL)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()

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

  const valueLabelUnit =
    view === ChartView.VOL
      ? 'USD'
      : view === ChartView.TVL
      ? 'USD'
      : view === ChartView.FEES
      ? 'USD'
      : view === ChartView.PRICE
      ? tierData.pool.token0.symbol
      : ''

  const value = latestValue
    ? latestValue
    : view === ChartView.VOL
    ? formattedVolumeData[formattedVolumeData.length - 1]?.value
    : view === ChartView.TVL
    ? formattedTvlData[formattedTvlData.length - 1]?.value
    : view === ChartView.FEES
    ? formattedFeesUSD[formattedFeesUSD.length - 1]?.value
    : view === ChartView.PRICE
    ? formattedPrice0[formattedPrice0.length - 1]?.value
    : undefined

  const data =
    view === ChartView.VOL
      ? formattedVolumeData
      : view === ChartView.TVL
      ? formattedTvlData
      : view === ChartView.FEES
      ? formattedFeesUSD
      : view !== ChartView.PRICE
      ? formattedPrice0
      : undefined

  const handlerHoverData: SeriesHoverDataHandler = useCallback((value, event) => {
    setLatestValue(value as number)
    setValueLabel(event.time && isUTCTimestamp(event.time) ? unixToDate(event.time, 'MMM D, YYYY') : '')
  }, [])

  return (
    <DarkGreyCard>
      {chartData == null ? (
        <Loader />
      ) : (
        <AutoColumn gap="1rem">
          <ToggleRow align="flex-start">
            <AutoColumn>
              <TYPE.label fontSize="24px" minHeight="30px">
                <MonoSpace>
                  {value != null ? formatDollarAmount(value) : ''} {valueLabelUnit}
                </MonoSpace>
              </TYPE.label>
              <TYPE.main minHeight="20px" fontSize="12px">
                {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : ''}
              </TYPE.main>
            </AutoColumn>
            <ToggleWrapper>
              <ToggleElementFree
                isActive={view === ChartView.VOL}
                fontSize="12px"
                onClick={() => (view === ChartView.VOL ? setView(ChartView.TVL) : setView(ChartView.VOL))}
              >
                Volume
              </ToggleElementFree>
              <ToggleElementFree
                isActive={view === ChartView.TVL}
                fontSize="12px"
                onClick={() => (view === ChartView.TVL ? setView(ChartView.DENSITY) : setView(ChartView.TVL))}
              >
                TVL
              </ToggleElementFree>
              {activeNetwork === ArbitrumNetworkInfo ? null : (
                <ToggleElementFree
                  isActive={view === ChartView.DENSITY}
                  fontSize="12px"
                  onClick={() => (view === ChartView.DENSITY ? setView(ChartView.VOL) : setView(ChartView.DENSITY))}
                >
                  Liquidity
                </ToggleElementFree>
              )}
              <ToggleElementFree
                isActive={view === ChartView.FEES}
                fontSize="12px"
                onClick={() => (view === ChartView.FEES ? setView(ChartView.TVL) : setView(ChartView.FEES))}
              >
                Fees
              </ToggleElementFree>
              <ToggleElementFree
                isActive={view === ChartView.PRICE}
                fontSize="12px"
                onClick={() => (view === ChartView.PRICE ? setView(ChartView.TVL) : setView(ChartView.PRICE))}
              >
                <DesktopOnly>{tierData.pool.token1.symbol}&nbsp;</DesktopOnly>Price
              </ToggleElementFree>
            </ToggleWrapper>
          </ToggleRow>
          {view !== ChartView.DENSITY ? (
            <Chart height={340} disableScroll autoFitDeps={[data]}>
              {view === ChartView.TVL ? (
                <LineChart data={formattedTvlData} color={color} onHoverData={handlerHoverData} />
              ) : view === ChartView.VOL ? (
                <BarChart data={formattedVolumeData} color={color} onHoverData={handlerHoverData} />
              ) : view === ChartView.FEES ? (
                <BarChart data={formattedFeesUSD} color={color} onHoverData={handlerHoverData} />
              ) : view === ChartView.PRICE ? (
                // <CandlestickSeries options={CANDLESTICK_SERIES_OPTIONS} data={formattedPrice0} />
                <LineChart data={formattedPrice0} color={color} onHoverData={handlerHoverData} />
              ) : null}
            </Chart>
          ) : (
            <DensityChart tierKey={tierKey} />
          )}
        </AutoColumn>
      )}
    </DarkGreyCard>
  )
}
