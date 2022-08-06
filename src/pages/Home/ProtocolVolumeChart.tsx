import { SmallOptionButton } from 'components/Button'
import { ChartCard } from 'components/Card'
import BarChart from 'components/charts2/BarChart'
import { TimeSeriesHoverHandler } from 'components/charts2/types'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useTransformedVolumeDataWithTimestamp } from 'hooks/chart'
import React, { useCallback, useMemo, useState } from 'react'
import { useProtocolChartData } from 'state/protocol/hooks'
import { TYPE } from 'theme'
import { VolumeWindow } from 'types'
import { formatDollarAmount } from 'utils/numbers'

dayjs.extend(utc)

const useHandleHoverData = (defaultValue: number | undefined, volumeWindow: VolumeWindow, now: dayjs.Dayjs) => {
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  const value = latestValue ?? defaultValue

  const handleHoverData: TimeSeriesHoverHandler = useCallback(
    (datum) => {
      setLatestValue(datum?.values[0])

      if (!datum?.time) {
        setValueLabel(undefined)
      } else {
        const day = dayjs.unix(datum.time).utc()
        switch (volumeWindow) {
          case VolumeWindow.monthly: {
            const endOfMonth = day.endOf('month')
            const isCurrent = !endOfMonth.isBefore(now)
            setValueLabel(day.format('MMM D') + '-' + (isCurrent ? 'present' : endOfMonth.format('MMM D, YYYY')))
            break
          }
          case VolumeWindow.weekly: {
            const endOfWeek = day.endOf('week')
            const isCurrent = !endOfWeek.isBefore(now)
            setValueLabel(day.format('MMM D') + '-' + (isCurrent ? 'present' : endOfWeek.format('MMM D, YYYY')))
            break
          }
          default:
            setValueLabel(day.format('MMM D, YYYY'))
            break
        }
      }
    },
    [volumeWindow, now]
  )

  return { value, valueLabel, handleHoverData, setLatestValue, setValueLabel }
}

export default function ProtocolVolumeChart({ color = '#56B2A4', height }: { height?: number; color?: string }) {
  const [chartData] = useProtocolChartData()

  const dailyVolumeData = useMemo(
    () =>
      chartData?.map((day) => ({
        time: day.date,
        value: day.volumeUSD,
      })) ?? [],
    [chartData]
  )

  const weeklyVolumeData = useTransformedVolumeDataWithTimestamp(chartData, 'week')
  const monthlyVolumeData = useTransformedVolumeDataWithTimestamp(chartData, 'month')

  const [volumeWindow, setVolumeWindow] = useState(VolumeWindow.daily)

  const data =
    volumeWindow === VolumeWindow.monthly
      ? monthlyVolumeData
      : volumeWindow === VolumeWindow.weekly
      ? weeklyVolumeData
      : dailyVolumeData

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => dayjs(), [chartData])

  const handler = useHandleHoverData(data[data.length - 1]?.value, volumeWindow, now)

  return (
    <ChartCard minHeight={height}>
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
            <MonoSpace> {formatDollarAmount(handler.value, 2)}</MonoSpace>
          </TYPE.largeHeader>
          <TYPE.main fontSize="12px" height="14px">
            {handler.valueLabel ? <MonoSpace>{handler.valueLabel} (UTC)</MonoSpace> : null}
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
      <BarChart height={height} data={data} color={color} onHoverData={handler.handleHoverData} />
    </ChartCard>
  )
}
