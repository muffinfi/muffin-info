import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import gql from 'graphql-tag'
import { TierChartEntry, TierKey } from 'state/tiers/reducer'
import { normalizeKey } from 'state/tiers/utils'

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)
const ONE_DAY_UNIX = 24 * 60 * 60

const TIER_CHART = gql`
  query tierDayDatas($startTime: Int!, $skip: Int!, $tierKey: Bytes!) {
    tierDayDatas(
      first: 1000
      skip: $skip
      where: { tier: $tierKey, date_gt: $startTime }
      orderBy: date
      orderDirection: asc
      subgraphError: allow
    ) {
      date
      volumeUSD
      tvlUSD
      feesUSD
      open
      high
      low
      close
      token0Price
      token1Price
    }
  }
`

interface ChartResults {
  tierDayDatas: {
    date: number
    volumeUSD: string
    tvlUSD: string
    feesUSD: string
    open: string
    high: string
    low: string
    close: string
    token0Price: string
    token1Price: string
  }[]
}

export async function fetchTierChartData(key: TierKey, client: ApolloClient<NormalizedCacheObject>) {
  let data: ChartResults['tierDayDatas'] = []
  const startTimestamp = 1619170975
  const endTimestamp = dayjs.utc().unix()

  let error = false
  let skip = 0
  let allFound = false

  const normalized = normalizeKey(key)

  try {
    while (!allFound) {
      const { data: chartResData, error, loading } = await client.query<ChartResults>({
        query: TIER_CHART,
        variables: {
          tierKey: normalized,
          startTime: startTimestamp,
          skip,
        },
        fetchPolicy: 'cache-first',
      })
      if (!loading) {
        skip += 1000
        if (chartResData.tierDayDatas.length < 1000 || error) {
          allFound = true
        }
        if (chartResData) {
          data = data.concat(chartResData.tierDayDatas)
        }
      }
    }
  } catch {
    error = true
  }

  if (data) {
    const formattedExisting = data.reduce((accum: { [date: number]: TierChartEntry }, dayData) => {
      const roundedDate = parseInt((dayData.date / ONE_DAY_UNIX).toFixed(0))
      accum[roundedDate] = {
        date: dayData.date,
        volumeUSD: parseFloat(dayData.volumeUSD),
        totalValueLockedUSD: parseFloat(dayData.tvlUSD),
        feesUSD: parseFloat(dayData.feesUSD),
        open: parseFloat(dayData.open),
        close: parseFloat(dayData.close),
        high: parseFloat(dayData.high),
        low: parseFloat(dayData.low),
        token0Price: parseFloat(dayData.token0Price),
        token1Price: parseFloat(dayData.token1Price),
      }
      return accum
    }, {})

    const firstEntry = formattedExisting[parseInt(Object.keys(formattedExisting)[0])]

    // fill in empty days ( there will be no day datas if no trades made that day )
    let timestamp = firstEntry?.date ?? startTimestamp
    let latestEntry = firstEntry
    while (timestamp < endTimestamp - ONE_DAY_UNIX) {
      const nextDay = timestamp + ONE_DAY_UNIX
      const currentDayIndex = parseInt((nextDay / ONE_DAY_UNIX).toFixed(0))
      if (!Object.keys(formattedExisting).includes(currentDayIndex.toString())) {
        formattedExisting[currentDayIndex] = {
          date: nextDay,
          volumeUSD: 0,
          totalValueLockedUSD: latestEntry?.totalValueLockedUSD ?? 0,
          feesUSD: 0,
          open: latestEntry?.close ?? 0,
          close: latestEntry?.close ?? 0,
          high: latestEntry?.close ?? 0,
          low: latestEntry?.close ?? 0,
          token0Price: latestEntry?.token0Price ?? 0,
          token1Price: latestEntry?.token1Price ?? 0,
        }
      } else {
        latestEntry = formattedExisting[currentDayIndex]
      }
      timestamp = nextDay
    }

    const dateMap = Object.keys(formattedExisting).map((key) => {
      return formattedExisting[parseInt(key)]
    })

    return {
      data: dateMap,
      error: false,
    }
  } else {
    return {
      data: undefined,
      error,
    }
  }
}
