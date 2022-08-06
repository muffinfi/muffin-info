type Time = number
type Value = number

export type TimeSeriesDatum = {
  time: Time
  value: Value
  metadata?: any
}

export type TimeSeriesDataHandler = (datum: { time: Time | undefined; value: Value | undefined }) => void

// ------

export type MergedTimeSeriesDatum = {
  time: number
  values: (number | undefined)[]
  metadatas: any[]
}

export type TimeSeriesHoverHandler = (datum: MergedTimeSeriesDatum | undefined) => void
