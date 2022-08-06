import CandleChart from 'components/CandleChart'
import { DarkGreyCard } from 'components/Card'
import BarChart from 'components/charts2/BarChart'
import ChartLabel, { useHandleHoverData } from 'components/charts2/ChartLabel'
import LineChart from 'components/charts2/LineChart'
import { TimeSeriesDatum } from 'components/charts2/types'
import Loader from 'components/Loader'
import { ONE_HOUR_SECONDS, TimeWindow } from 'constants/intervals'
import React, { useMemo, useState } from 'react'
import { useTokenChartData, useTokenPriceData } from 'state/tokens/hooks'
import { TokenData } from 'state/tokens/reducer'
import styled from 'styled-components/macro'
import { PriceChartEntry } from 'types'
import { currentTimestamp } from 'utils'

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

const DEFAULT_TIME_WINDOW = TimeWindow.WEEK

export default function TokenCharts({
  address,
  color,
  tokenData,
}: {
  address: string
  color: string
  tokenData: TokenData
}) {
  const chartData = useTokenChartData(address)

  // chart data
  const { tvlData, volumeData } = useMemo(() => {
    const tvlData: TimeSeriesDatum[] = []
    const volumeData: TimeSeriesDatum[] = []
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
      })
    }
    return { tvlData, volumeData }
  }, [chartData])

  // price chart data
  const [timeWindow] = useState(DEFAULT_TIME_WINDOW)
  const priceData = useTokenPriceData(address, ONE_HOUR_SECONDS, timeWindow)
  const adjustedToCurrent = useMemo(() => {
    if (priceData && tokenData && priceData.length > 0) {
      const adjusted: PriceChartEntry[] = Object.assign([], priceData)
      adjusted.push({
        time: currentTimestamp() / 1000,
        open: priceData[priceData.length - 1].close,
        close: tokenData?.priceUSD,
        high: tokenData?.priceUSD,
        low: priceData[priceData.length - 1].close,
      })
      return adjusted
    } else {
      return undefined
    }
  }, [priceData, tokenData])

  // chart label setters
  const tvlHandler = useHandleHoverData(tvlData[tvlData.length - 1]?.value)
  const volumeHandler = useHandleHoverData(volumeData[volumeData.length - 1]?.value)
  const [priceLatestValue, setPriceLatestValue] = useState<number | undefined>()
  const [priceValueLabel, setPriceValueLabel] = useState<string | undefined>()

  if (chartData == null)
    return (
      <DarkGreyCard>
        <Loader />
      </DarkGreyCard>
    )

  return (
    <Layout>
      <WideDarkGreyCard>
        Price
        <ChartLabel
          value={priceLatestValue ?? adjustedToCurrent?.[adjustedToCurrent.length - 1]?.close}
          valueUnit={adjustedToCurrent ? 'USD' : ''}
          valueLabel={priceValueLabel}
        />
        {adjustedToCurrent ? (
          <CandleChart
            data={adjustedToCurrent}
            setValue={setPriceLatestValue}
            setLabel={setPriceValueLabel}
            color={color}
            height={270}
            minHeight={270}
          />
        ) : (
          <Loader />
        )}
      </WideDarkGreyCard>

      <DarkGreyCard>
        Volume 24h
        <ChartLabel value={volumeHandler.value} valueUnit={'USD'} valueLabel={volumeHandler.valueLabel} />
        <BarChart data={volumeData} color={color} height={270} onHoverData={volumeHandler.handleHoverData} />
      </DarkGreyCard>

      <DarkGreyCard>
        TVL
        <ChartLabel value={tvlHandler.value} valueUnit={'USD'} valueLabel={tvlHandler.valueLabel} />
        <LineChart data={tvlData} color={color} height={270} onHoverData={tvlHandler.handleHoverData} />
      </DarkGreyCard>
    </Layout>
  )
}
