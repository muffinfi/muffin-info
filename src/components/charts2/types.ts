type Time = number
type Value = number

export type TimeSeriesDatum = { time: Time; value: Value }
export type TimeSeriesDataHandler = (datum: { time: Time | undefined; value: Value | undefined }) => void
