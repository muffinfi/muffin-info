import { Pool, PoolMath, TickMath } from '@muffinfi/muffin-v1-sdk'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import React, { useMemo } from 'react'
import { TooltipProps } from 'recharts'
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
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

interface CustomToolTipProps<TValue extends ValueType, TName extends NameType> {
  chartProps: TooltipProps<TValue, TName>
  pool: Pool | undefined
  currentTickIdx: number
}

export function CustomToolTip<TValue extends ValueType, TName extends NameType>({
  chartProps,
  pool,
  currentTickIdx,
}: CustomToolTipProps<TValue, TName>) {
  const theme = useTheme()
  const tickIdx = chartProps?.payload?.[0]?.payload.tickIdx
  const activeLiquidityD8 = chartProps?.payload?.[0]?.payload.activeLiquidityD8
  const price0 = chartProps?.payload?.[0]?.payload.price0
  const price1 = chartProps?.payload?.[0]?.payload.price1

  const tickIsLeftSide = tickIdx != null && tickIdx < currentTickIdx
  const { tokenLocked, tvl } = useMemo(() => {
    if (tickIdx === currentTickIdx) return { tokenLocked: pool?.token1 }
    const { amount0, amount1 }: Partial<ReturnType<typeof PoolMath.amountsForLiquidityD8>> =
      tickIdx != null && pool?.tickSpacing
        ? PoolMath.amountsForLiquidityD8(
            TickMath.tickToSqrtPriceX72(tickIdx),
            TickMath.tickToSqrtPriceX72(tickIdx + pool.tickSpacing * (tickIsLeftSide ? -2 : 1)),
            TickMath.tickToSqrtPriceX72(tickIdx + pool.tickSpacing * (tickIsLeftSide ? -1 : 2)),
            activeLiquidityD8,
            false
          )
        : {}
    const tvlToken0 = pool?.token0
      ? parseFloat(amount0 ? CurrencyAmount.fromRawAmount(pool.token0, amount0).toExact() : '0')
      : undefined
    const tvlToken1 = pool?.token1
      ? parseFloat(amount1 ? CurrencyAmount.fromRawAmount(pool.token1, amount1).toExact() : '0')
      : undefined
    return {
      tokenLocked: tickIsLeftSide ? pool?.token1 : pool?.token0,
      tvl: tickIsLeftSide ? tvlToken1 : tvlToken0,
    }
  }, [tickIdx, pool?.tickSpacing, pool?.token0, pool?.token1, activeLiquidityD8, currentTickIdx, tickIsLeftSide])

  return (
    <TooltipWrapper>
      <AutoColumn gap="sm">
        <TYPE.main color={theme.text3}>Tick stats</TYPE.main>
        <RowBetween>
          <TYPE.label>{pool?.token0?.symbol} Price: </TYPE.label>
          <TYPE.label>
            {price0
              ? Number(price0).toLocaleString(undefined, {
                  minimumSignificantDigits: 1,
                })
              : ''}{' '}
            {pool?.token1?.symbol}
          </TYPE.label>
        </RowBetween>
        <RowBetween>
          <TYPE.label>{pool?.token1?.symbol} Price: </TYPE.label>
          <TYPE.label>
            {price1
              ? Number(price1).toLocaleString(undefined, {
                  minimumSignificantDigits: 1,
                })
              : ''}{' '}
            {pool?.token0?.symbol}
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
