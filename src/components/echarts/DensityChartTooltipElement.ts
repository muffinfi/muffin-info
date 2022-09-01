import { PoolMath, TickMath, toD8 } from '@muffinfi/muffin-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { shallowEqual } from 'react-redux'
import { formatAmount } from 'utils/numbers'

const getPriceString = (price: number) => {
  if (price === 0) return '<0.0001'
  if (price < 0.00001) return price.toExponential(5)
  if (price < 0.0001) return price.toLocaleString(undefined, { maximumSignificantDigits: 2 })
  if (price < 0.001) return price.toLocaleString(undefined, { maximumSignificantDigits: 3 })
  if (price < 0.01) return price.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  if (price < 10_000) return price.toLocaleString(undefined, { maximumSignificantDigits: 5 })
  if (price < 1_000_000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return price.toExponential(5)
}

interface DensityChartTooltipElementState {
  token0?: Token
  token1?: Token
  tickIdx?: number
  activeTickIdx?: number
  tickSpacing?: number
  liquidityActive?: JSBI
}

export class DensityChartTooltipElement {
  private divWrapper: HTMLDivElement
  private token0Label: HTMLSpanElement
  private token0Price: HTMLSpanElement
  private token1Label: HTMLSpanElement
  private token1Price: HTMLSpanElement
  private lockedRow: HTMLDivElement
  private lockedLabel: HTMLSpanElement
  private lockedTvl: HTMLSpanElement
  private state: DensityChartTooltipElementState

  constructor() {
    this.state = {}

    this.divWrapper = document.createElement('div')
    this.divWrapper.style.display = 'flex'
    this.divWrapper.style.flexDirection = 'column'
    this.divWrapper.style.gap = '8px'

    {
      const span = document.createElement('span')
      span.innerText = 'Tick info'
      this.divWrapper.append(span)
    }

    {
      const row = this.createRow()
      this.token0Label = this.createLabel()
      this.token0Price = this.createLabel()
      row.append(this.token0Label, this.token0Price)
      this.divWrapper.append(row)
    }

    {
      const row = this.createRow()
      this.token1Label = this.createLabel()
      this.token1Price = this.createLabel()
      row.append(this.token1Label, this.token1Price)
      this.divWrapper.append(row)
    }

    this.lockedRow = this.createRow()
    this.lockedLabel = this.createLabel()
    this.lockedTvl = this.createLabel()
    this.lockedRow.append(this.lockedLabel, this.lockedTvl)
    this.divWrapper.append(this.lockedRow)
  }

  private createRow() {
    const row = document.createElement('div')
    row.style.display = 'flex'
    row.style.justifyContent = 'space-between'
    row.style.gap = '8px'
    return row
  }

  private createLabel() {
    const span = document.createElement('span')
    span.style.fontWeight = '500'
    return span
  }

  render() {
    return this.divWrapper
  }

  update(state: DensityChartTooltipElementState) {
    if (shallowEqual(state, this.state)) return
    const { token0, token1, tickIdx, activeTickIdx, tickSpacing, liquidityActive } = state
    if (!token0 || !token1 || tickIdx == null || tickSpacing == null) {
      return
    }
    const price0 = 1.0001 ** tickIdx * 10 ** (token0?.decimals - token1?.decimals)
    const price1 = 1 / price0

    this.token0Label.innerText = `${token0?.symbol} Price: `
    this.token0Price.innerText = `${price0 ? getPriceString(price0) : ''} ${token1?.symbol}`
    this.token1Label.innerText = `${token1?.symbol} Price: `
    this.token1Price.innerText = `${price1 ? getPriceString(price1) : ''} ${token0?.symbol}`

    if (activeTickIdx == null || !liquidityActive) return
    const activeLiquidityD8 = liquidityActive ? toD8(liquidityActive) : undefined
    const tickIsLeftSide = tickIdx < activeTickIdx

    const { tokenLocked, tvl }: { tokenLocked?: Token; tvl?: number } = (() => {
      if (!activeLiquidityD8) return {}
      if (tickIdx === activeTickIdx) return {}
      const {
        amount0,
        amount1,
      }: Partial<ReturnType<typeof PoolMath.amountsForLiquidityDeltaD8>> = PoolMath.amountsForLiquidityDeltaD8(
        TickMath.tickToSqrtPriceX72(tickIdx),
        TickMath.tickToSqrtPriceX72(tickIdx + tickSpacing * (tickIsLeftSide ? -2 : 1)),
        TickMath.tickToSqrtPriceX72(tickIdx + tickSpacing * (tickIsLeftSide ? -1 : 2)),
        activeLiquidityD8
      )
      const tvlToken0 = token0
        ? parseFloat(amount0 ? CurrencyAmount.fromRawAmount(token0, amount0).toExact() : '0')
        : undefined
      const tvlToken1 = token1
        ? parseFloat(amount1 ? CurrencyAmount.fromRawAmount(token1, amount1).toExact() : '0')
        : undefined
      return {
        tokenLocked: tickIsLeftSide ? token1 : token0,
        tvl: tickIsLeftSide ? tvlToken1 : tvlToken0,
      }
    })()

    this.lockedRow.style.display = !tokenLocked || !tvl ? 'none' : 'flex'
    this.lockedLabel.innerText = `${tokenLocked?.symbol} Locked: `
    this.lockedTvl.innerText = `${tvl ? formatAmount(tvl) : ''} ${tokenLocked?.symbol}`
  }
}
