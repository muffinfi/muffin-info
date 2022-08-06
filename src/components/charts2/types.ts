export type TimeSeriesDatum = {
  time: number
  value: number
  metadata?: any
}

export type MergedTimeSeriesDatum = {
  time: number
  values: (number | undefined)[]
  metadatas: any[]
}

export type TimeSeriesHoverHandler = (datum: MergedTimeSeriesDatum | undefined) => void
