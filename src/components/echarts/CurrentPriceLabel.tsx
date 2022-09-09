import { Token } from '@uniswap/sdk-core'
import { GreyBadge } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowFixed } from 'components/Row'
import React from 'react'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { feeTierPercent } from 'utils'

const Wrapper = styled.div`
  border-radius: 8px;
  padding: 6px 12px;
  color: white;
  width: fit-content;
  font-size: 14px;
  background-color: ${({ theme }) => theme.bg2};
`

const Badge = styled(GreyBadge)`
  display: flex;
  align-items: center;
  gap: 6px;
`

interface LabelProps {
  x: number
  y: number
  index: number
}

interface CurrentPriceLabelProps {
  token0?: Token
  token1?: Token
  price0?: string
  price1?: string
  color: string
  feeTier?: string | number
}

export function CurrentPriceLabel({ token0, token1, color, price0, price1, feeTier }: CurrentPriceLabelProps) {
  const badge = (
    <div
      style={{
        height: '6px',
        width: '6px',
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
  )
  return (
    <Wrapper>
      <AutoColumn gap="6px">
        <RowFixed align="center">
          <TYPE.main mr="6px">Current Price</TYPE.main>
          {feeTier ? (
            <Badge>
              {badge}
              {feeTierPercent(+feeTier)}
            </Badge>
          ) : (
            badge
          )}
        </RowFixed>
        <TYPE.label>{`1 ${token0?.symbol} = ${price0} ${token1?.symbol}`}</TYPE.label>
        <TYPE.label>{`1 ${token1?.symbol} = ${price1} ${token0?.symbol}`}</TYPE.label>
      </AutoColumn>
    </Wrapper>
  )
}
