import numbro from 'numbro'

// using a currency library here in case we want to add more in future
export const formatDollarAmount = (num: number | undefined, digits = 2, round = true) => {
  if (num === 0) return '$0.00'
  if (!num) return '-'
  if (num < 0.001 && digits <= 3) {
    return '<$0.001'
  }

  return numbro(num).formatCurrency({
    average: round,
    mantissa: num > 1000 ? 2 : digits,
    abbreviations: {
      million: 'M',
      billion: 'B',
    },
  })
}

// using a currency library here in case we want to add more in future
export const formatAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return '0'
  if (!num) return '-'
  if (num < 0.001) {
    return '<0.001'
  }
  return numbro(num).format({
    average: true,
    mantissa: num > 1000 ? 2 : digits,
    abbreviations: {
      million: 'M',
      billion: 'B',
    },
  })
}

export const formatAmountDetailed = (num: number | undefined, digits = 2) => {
  if (num === 0) return '0'
  if (!num) return '-'

  if (num < 0.00001) return '<0.000001'
  if (num < 0.0001) return num.toLocaleString(undefined, { maximumSignificantDigits: 1 })
  if (num < 0.001) return num.toLocaleString(undefined, { maximumSignificantDigits: 2 })
  if (num < 0.01) return num.toLocaleString(undefined, { maximumSignificantDigits: 3 })
  if (num < 10000) return num.toLocaleString(undefined, { maximumSignificantDigits: 4, minimumSignificantDigits: 4 })
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
