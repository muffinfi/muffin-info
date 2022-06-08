import { SmallOptionButton } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useTransformedVolumeData } from 'hooks/chart'
import { isUTCTimestamp, UTCTimestamp } from 'lightweight-charts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { SeriesHoverDataHandler } from 'react-lightweight-charts-simple'
import { useProtocolChartData } from 'state/protocol/hooks'
import { TYPE } from 'theme'
import { VolumeWindow } from 'types'
import { formatDollarAmount } from 'utils/numbers'
import { ChartCard } from '../Card'
import BarChart from './base/BarChart'
import Chart from './base/Chart'

dayjs.extend(utc)

export default function ProtocolVolumeChart({
  color = '#56B2A4',
  height,
  minHeight,
}: {
  height?: number
  minHeight?: number
  color?: string
}) {
  const [date, setDate] = useState('')
  const [volume, setVolume] = useState<number | undefined>()

  const [chartData] = useProtocolChartData()

  const formattedVolumeData = useMemo(
    () =>
      chartData?.map((day) => {
        return {
          time: day.date as UTCTimestamp,
          value: day.volumeUSD,
        }
      }) ?? [],
    [chartData]
  )

  const weeklyVolumeData = useTransformedVolumeData(chartData, 'week')
  const monthlyVolumeData = useTransformedVolumeData(chartData, 'month')

  const [volumeWindow, setVolumeWindow] = useState(VolumeWindow.daily)

  const data =
    volumeWindow === VolumeWindow.monthly
      ? monthlyVolumeData
      : volumeWindow === VolumeWindow.weekly
      ? weeklyVolumeData
      : formattedVolumeData

  const lastValue = data[data.length - 1]?.value

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => dayjs(), [chartData])

  const handleCrosshairMove: SeriesHoverDataHandler = useCallback(
    (value, event) => {
      if (!event.time) {
        setDate('')
      } else {
        const day = dayjs(
          isUTCTimestamp(event.time) ? event.time * 1000 : `${event.time.year}-${event.time.month}-${event.time.day}`
        )
        switch (volumeWindow) {
          case VolumeWindow.monthly: {
            const endOfMonth = day.endOf('month')
            const isCurrent = !endOfMonth.isBefore(now)
            setDate(day.format('MMM D') + '-' + (isCurrent ? 'present' : endOfMonth.format('MMM D, YYYY')))
            break
          }
          case VolumeWindow.weekly: {
            const endOfWeek = day.endOf('week')
            const isCurrent = !endOfWeek.isBefore(now)
            setDate(day.format('MMM D') + '-' + (isCurrent ? 'present' : endOfWeek.format('MMM D, YYYY')))
            break
          }
          default:
            setDate(day.format('MMM D, YYYY'))
            break
        }
      }
      setVolume((value as number) ?? lastValue)
    },
    [lastValue, volumeWindow, now]
  )

  useEffect(() => {
    setVolume(lastValue)
  }, [lastValue])

  return (
    <ChartCard minHeight={minHeight}>
      <RowBetween>
        <AutoColumn gap="4px">
          <TYPE.mediumHeader fontSize="16px">
            {volumeWindow === VolumeWindow.monthly
              ? 'Monthly'
              : volumeWindow === VolumeWindow.weekly
              ? 'Weekly'
              : 'Daily'}{' '}
            Volume
          </TYPE.mediumHeader>
          <TYPE.largeHeader fontSize="32px">
            <MonoSpace> {formatDollarAmount(volume, 2)}</MonoSpace>
          </TYPE.largeHeader>
          <TYPE.main fontSize="12px" height="14px">
            {date ? <MonoSpace>{date} (UTC)</MonoSpace> : null}
          </TYPE.main>
        </AutoColumn>
        <RowFixed style={{ marginLeft: '-40px', marginTop: '8px' }}>
          <SmallOptionButton
            active={volumeWindow === VolumeWindow.daily}
            onClick={() => setVolumeWindow(VolumeWindow.daily)}
          >
            D
          </SmallOptionButton>
          <SmallOptionButton
            active={volumeWindow === VolumeWindow.weekly}
            style={{ marginLeft: '8px' }}
            onClick={() => setVolumeWindow(VolumeWindow.weekly)}
          >
            W
          </SmallOptionButton>
          <SmallOptionButton
            active={volumeWindow === VolumeWindow.monthly}
            style={{ marginLeft: '8px' }}
            onClick={() => setVolumeWindow(VolumeWindow.monthly)}
          >
            M
          </SmallOptionButton>
        </RowFixed>
      </RowBetween>
      <Chart height={height} disableScroll autoFitDeps={[data]}>
        <BarChart data={data} color={color} onHoverData={handleCrosshairMove} />
      </Chart>
    </ChartCard>
  )
}
