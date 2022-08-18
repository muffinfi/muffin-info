import { AutoColumn } from 'components/Column'
import { MonoSpace } from 'components/shared'
import React, { useCallback, useState } from 'react'
import { TYPE } from 'theme'
import { unixToDate } from 'utils/date'
import { formatAmount, formatDollarAmount } from 'utils/numbers'
import { TimeSeriesHoverHandler } from './types'

export const useHandleHoverData = (defaultValue?: number | (() => number) | undefined) => {
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  const value = latestValue ?? (typeof defaultValue === 'function' ? defaultValue() : defaultValue)

  const handleHoverData: TimeSeriesHoverHandler = useCallback((datum) => {
    setLatestValue(datum?.values.reduce((acc: number, cur) => acc + (cur ?? 0), 0))
    setValueLabel(datum?.time ? unixToDate(datum.time, 'MMM D, YYYY') : '')
  }, [])

  return { value, valueLabel, handleHoverData, setLatestValue, setValueLabel }
}

const ChartLabel = ({
  value,
  valueUnit,
  valueLabel,
  isDollar = true,
}: {
  value: number | undefined
  valueUnit: string | undefined
  valueLabel: string | undefined
  isDollar?: boolean
}) => {
  const formatValue = isDollar ? formatDollarAmount : formatAmount
  return (
    <AutoColumn>
      <TYPE.label fontSize="24px" minHeight="30px">
        <MonoSpace>
          {value != null ? formatValue(value) : ''} {valueUnit}
        </MonoSpace>
      </TYPE.label>
      <TYPE.main minHeight="20px" fontSize="12px">
        <MonoSpace>{valueLabel ? <>{valueLabel} (UTC)</> : ''}</MonoSpace>
      </TYPE.main>
    </AutoColumn>
  )
}

export default ChartLabel
