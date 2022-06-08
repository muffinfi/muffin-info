import { useEffect } from 'react'
import { useChart } from 'react-lightweight-charts-simple'

export default function ChartVisibleLogicalRangeSetter({ from, to }: { from?: number; to?: number }) {
  const { chart } = useChart()

  useEffect(() => {
    const timeScale = chart?.timeScale()
    if (!timeScale || from == null || to == null) return
    timeScale.setVisibleLogicalRange({
      from,
      to,
    })
  }, [chart, from, to])

  return null
}
