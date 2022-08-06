import { ChartCard } from 'components/Card'
import { useHandleHoverData } from 'components/charts2/ChartLabel'
import LineChart from 'components/charts2/LineChart'
import { AutoColumn } from 'components/Column'
import { MonoSpace } from 'components/shared'
import React, { useMemo } from 'react'
import { useProtocolChartData } from 'state/protocol/hooks'
import { TYPE } from 'theme'
import { formatDollarAmount } from 'utils/numbers'

export default function ProtocolTvlChart({ color = '#56B2A4', height }: { height?: number; color?: string }) {
  const [chartData] = useProtocolChartData()

  const formattedTvlData = useMemo(
    () =>
      chartData?.map((day) => ({
        time: day.date,
        value: day.tvlUSD,
      })) ?? [],
    [chartData]
  )

  const handler = useHandleHoverData(formattedTvlData[formattedTvlData.length - 1]?.value)

  return (
    <ChartCard minHeight={height}>
      <AutoColumn gap="4px">
        <TYPE.mediumHeader fontSize="16px">TVL</TYPE.mediumHeader>
        <TYPE.largeHeader fontSize="32px">
          <MonoSpace>{formatDollarAmount(handler.value)}</MonoSpace>
        </TYPE.largeHeader>
        <TYPE.main fontSize="12px" height="14px">
          {handler.valueLabel ? <MonoSpace>{handler.valueLabel} (UTC)</MonoSpace> : null}
        </TYPE.main>
      </AutoColumn>
      <LineChart height={height} data={formattedTvlData} color={color} onHoverData={handler.handleHoverData} />
    </ChartCard>
  )
}
