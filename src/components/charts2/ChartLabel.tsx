import { AutoColumn } from 'components/Column'
import { MonoSpace } from 'components/shared'
import React, { useCallback, useState } from 'react'
import { TYPE } from 'theme'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'
import { TimeSeriesDataHandler, TimeSeriesDatum } from './types'

export const useHandleHoverData = (defaultData?: TimeSeriesDatum | undefined) => {
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  const value = latestValue ?? defaultData?.value

  const handleHoverData: TimeSeriesDataHandler = useCallback(({ time, value }) => {
    setLatestValue(value)
    setValueLabel(time ? unixToDate(time, 'MMM D, YYYY') : '')
  }, [])

  return { value, valueLabel, handleHoverData }
}

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
        <MonoSpace>{valueLabel ? <>{valueLabel} (UTC)</> : ''}</MonoSpace>
      </TYPE.main>
    </AutoColumn>
  )
}

export default ChartLabel
