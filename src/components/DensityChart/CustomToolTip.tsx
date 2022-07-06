import { PoolMath, TickMath, toD8 } from '@muffinfi/muffin-v1-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import type { TierTickData } from 'data/tiers/tickData'
import useTheme from 'hooks/useTheme'
import React, { useMemo } from 'react'
import { TierData } from 'state/tiers/reducer'
import styled from 'styled-components'
import { TYPE } from 'theme'
import { formatAmount } from 'utils/numbers'

const TooltipWrapper = styled(LightCard)`
  padding: 12px;
  width: 320px;
  opacity: 0.6;
  font-size: 12px;
  z-index: 10;
`

interface CustomToolTipProps {
  pool: TierData['pool'] | undefined
  tickData: TierTickData | undefined
  index: number | undefined
  token0: Token | undefined
  token1: Token | undefined
}

const getPriceString = (price: number) => {
  if (price === 0) return '<0.0001'
  return price.toLocaleString(undefined, { minimumSignificantDigits: 1 })
}

export function CustomToolTip({ index, pool, tickData, token0, token1 }: CustomToolTipProps) {
  const theme = useTheme()
  const data = index != null ? tickData?.ticksProcessed[index] : undefined
  const { tickIdx, liquidityActive, price0, price1 } = data ?? {}
  const activeLiquidityD8 = liquidityActive ? toD8(liquidityActive) : undefined

  const tickIsLeftSide = tickIdx != null && tickData?.activeTickIdx != null && tickIdx < tickData.activeTickIdx
  const { tokenLocked, tvl } = useMemo(() => {
    if (!activeLiquidityD8) return {}
    if (tickIdx === tickData?.activeTickIdx) return { tokenLocked: token1 }
    const { amount0, amount1 }: Partial<ReturnType<typeof PoolMath.amountsForLiquidityDeltaD8>> =
      tickIdx != null && pool?.tickSpacing
        ? PoolMath.amountsForLiquidityDeltaD8(
            TickMath.tickToSqrtPriceX72(tickIdx),
            TickMath.tickToSqrtPriceX72(tickIdx + pool.tickSpacing * (tickIsLeftSide ? -2 : 1)),
            TickMath.tickToSqrtPriceX72(tickIdx + pool.tickSpacing * (tickIsLeftSide ? -1 : 2)),
            activeLiquidityD8
          )
        : {}
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
  }, [activeLiquidityD8, tickIdx, tickData?.activeTickIdx, token1, pool?.tickSpacing, tickIsLeftSide, token0])

  return (
    <TooltipWrapper>
      <AutoColumn gap="sm">
        <TYPE.main color={theme.text3}>Tick stats</TYPE.main>
        <RowBetween>
          <TYPE.label>{token0?.symbol} Price: </TYPE.label>
          <TYPE.label>
            {price0 ? getPriceString(parseFloat(price0)) : ''} {token1?.symbol}
          </TYPE.label>
        </RowBetween>
        <RowBetween>
          <TYPE.label>{token1?.symbol} Price: </TYPE.label>
          <TYPE.label>
            {price1 ? getPriceString(parseFloat(price1)) : ''} {token0?.symbol}
          </TYPE.label>
        </RowBetween>
        <RowBetween>
          <TYPE.label>{tokenLocked?.symbol} Locked: </TYPE.label>
          <TYPE.label>
            {tvl ? formatAmount(tvl) : ''} {tokenLocked?.symbol}
          </TYPE.label>
        </RowBetween>
      </AutoColumn>
    </TooltipWrapper>
  )
}

export default CustomToolTip
