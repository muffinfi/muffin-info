import { Token } from '@uniswap/sdk-core'
import Loader from 'components/Loader'
import { fetchTicksSurroundingPrice, TickProcessed } from 'data/tiers/tickData'
import {
  ChartOptions,
  DeepPartial,
  HistogramData,
  HistogramSeriesOptions,
  IChartApi,
  MouseEventParams,
  UTCTimestamp,
} from 'lightweight-charts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Chart, ChartFitContentTrigger, HistogramSeries, PriceLine, Tooltip } from 'react-lightweight-charts-simple'
import { useClients } from 'state/application/hooks'
import { useTierDatas, useTierTickData } from 'state/tiers/hooks'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'
import CustomToolTip from './CustomToolTip'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 340px;
`

const TIME_BASELINE = 1500000000
const DAY = 86400
const INITIAL_TICKS_TO_FETCH = 1000

const indexToTime = (index: number) => (TIME_BASELINE + index * DAY) as UTCTimestamp
const timeToIndex = (time: UTCTimestamp) => Math.floor((time - TIME_BASELINE) / DAY)

const BASE_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: 'transparent',
    textColor: '#565A69',
    fontFamily: 'Inter var',
  },
  rightPriceScale: {
    scaleMargins: {
      top: 0.1,
      bottom: 0,
    },

    drawTicks: false,
    borderVisible: false,
  },
  timeScale: {
    rightOffset: 0.1,
    borderVisible: false,
  },
  grid: {
    horzLines: {
      visible: false,
    },
    vertLines: {
      visible: false,
    },
  },
  crosshair: {
    horzLine: {
      visible: true,
      labelVisible: false,
    },
    vertLine: {
      visible: true,
      labelVisible: false,
    },
  },
}

const BASE_SERIES_OPTIONS: DeepPartial<HistogramSeriesOptions> = {
  color: '#2172E5',
  lastValueVisible: false,
  priceLineVisible: false,
  priceFormat: {
    type: 'custom',
    // TODO: change appropriate format
    formatter: (activeLiquidity: number) => {
      return activeLiquidity.toPrecision(1)
    },
  },
}

export default function DensityChart({ tierKey }: { tierKey: string }) {
  const { dataClient } = useClients()

  // poolData
  const tierData = useTierDatas(useMemo(() => [tierKey], [tierKey]))[0]
  const formattedAddress0 = isAddress(tierData.pool.token0.address)
  const formattedAddress1 = isAddress(tierData.pool.token1.address)

  // parsed tokens
  const token0 = useMemo(() => {
    return tierData && formattedAddress0 && formattedAddress1
      ? new Token(
          1,
          formattedAddress0,
          tierData.pool.token0.decimals,
          tierData.pool.token0.symbol,
          tierData.pool.token0.name
        )
      : undefined
  }, [formattedAddress0, formattedAddress1, tierData])
  const token1 = useMemo(() => {
    return tierData && formattedAddress1 && formattedAddress1
      ? new Token(
          1,
          formattedAddress1,
          tierData.pool.token1.decimals,
          tierData.pool.token1.symbol,
          tierData.pool.token1.name
        )
      : undefined
  }, [formattedAddress1, tierData])

  // tick data tracking
  const [tickData, updateTickData] = useTierTickData(tierKey)
  const [ticksToFetch, setTicksToFetch] = useState(INITIAL_TICKS_TO_FETCH)
  const amountTicks = ticksToFetch * 2 + 1

  const chartOptions: typeof BASE_CHART_OPTIONS = useMemo(
    () =>
      tickData?.ticksProcessed
        ? {
            ...BASE_CHART_OPTIONS,
            timeScale: {
              tickMarkFormatter: (time: UTCTimestamp) => {
                if (!token0?.decimals || !token1?.decimals) return ''

                const index = timeToIndex(time)
                const tickIdx = tickData.ticksProcessed[index].tickIdx
                const price0 = (1.0001 ** tickIdx / 10 ** token1.decimals) * 10 ** token0.decimals

                if (price0 < 0.00001) return price0.toExponential()
                if (price0 < 0.0001) return price0.toLocaleString(undefined, { maximumSignificantDigits: 2 })
                if (price0 < 0.001) return price0.toLocaleString(undefined, { maximumSignificantDigits: 3 })
                if (price0 < 0.01) return price0.toLocaleString(undefined, { maximumSignificantDigits: 4 })
                if (price0 < 10_000) return price0.toLocaleString(undefined, { maximumSignificantDigits: 5 })
                if (price0 < 1_000_000) return price0.toLocaleString(undefined, { maximumFractionDigits: 0 })
                return price0.toExponential()
              },
            },
          }
        : BASE_CHART_OPTIONS,
    [tickData?.ticksProcessed, token0?.decimals, token1?.decimals]
  )

  useEffect(() => {
    async function fetch() {
      const { data } = await fetchTicksSurroundingPrice(tierKey, dataClient, ticksToFetch)
      if (data) {
        updateTickData(tierKey, data)
      }
    }
    if (!tickData || (tickData && tickData.ticksProcessed.length < amountTicks)) {
      fetch()
    }
  }, [tierKey, tickData, updateTickData, ticksToFetch, amountTicks, dataClient])

  const { formattedData, currentPriceIndex } = useMemo(() => {
    let currentPriceIndex: number | undefined
    const formattedData = tickData?.ticksProcessed.map((t: TickProcessed, i) => {
      const value = parseFloat(t.liquidityActive.toString())
      if (t.tickIdx === tickData?.activeTickIdx) {
        currentPriceIndex = i
      }
      return {
        time: indexToTime(i),
        value,
        color: t.tickIdx === tickData?.activeTickIdx ? 'red' : undefined,
      } as HistogramData
    })
    return { formattedData, currentPriceIndex }
  }, [tickData?.activeTickIdx, tickData?.ticksProcessed])

  const tooltipContent = useCallback(
    ({ event }: { event: MouseEventParams }) => (
      <CustomToolTip
        index={event.time != null ? timeToIndex(event.time as UTCTimestamp) : undefined}
        pool={tierData.pool}
        tickData={tickData}
        token0={token0}
        token1={token1}
      />
    ),
    [tickData, tierData.pool, token0, token1]
  )

  const handleInit = useCallback(
    (chart: IChartApi | undefined) => {
      if (!chart || currentPriceIndex == null) return

      setTimeout(() => {
        chart.timeScale().fitContent()
        // chart.applyOptions({
        //   rightPriceScale: { autoScale: false },
        // })
        // setTimeout(() => {
        //   chart.timeScale().setVisibleLogicalRange({
        //     from: Math.max(0, currentPriceIndex - 25),
        //     to: Math.max(0, currentPriceIndex + 25),
        //   })
        // }, 0)
      }, 0)
    },
    [currentPriceIndex]
  )

  if (!tickData) {
    return <Loader />
  }

  return (
    <>
      {!formattedData ? (
        <div>No Data</div>
      ) : (
        <Wrapper>
          <Chart height={340} options={chartOptions} disableAutoContentFitOnInit onInit={handleInit}>
            <HistogramSeries
              data={formattedData}
              options={BASE_SERIES_OPTIONS}
              // FIXME: when setting markers, chart will shifted up
              // markers={markers as SeriesMarker<UTCTimestamp>[]}
            >
              {currentPriceIndex != null ? (
                <>
                  {/* TODO: zoom it by default */}
                  {/* <ChartVisibleLogicalRangeSetter
                    from={Math.max(0, currentPriceIndex - surroundingCount)}
                    to={Math.min(formattedData.length - 1, currentPriceIndex + surroundingCount)}
                  /> */}
                  <PriceLine price={formattedData[currentPriceIndex].value} title="Active liquidity" />
                </>
              ) : null}
            </HistogramSeries>
            <Tooltip content={tooltipContent} />
            <ChartFitContentTrigger deps={[formattedData]} />
          </Chart>
        </Wrapper>
      )}
    </>
  )
}
