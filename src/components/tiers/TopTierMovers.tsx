import { GreyBadge, GreyCard, ScrollableX } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Loader'
import Percent from 'components/Percent'
import { RowFixed } from 'components/Row'
import React, { useMemo } from 'react'
import { useAllTierData } from 'state/tiers/hooks'
import { TierData } from 'state/tiers/reducer'
import styled from 'styled-components'
import { StyledInternalLink, TYPE } from 'theme'
import { feeTierPercent } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

const Container = styled(StyledInternalLink)`
  min-width: 210px;
  margin-right: 16px;

  :hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const Wrapper = styled(GreyCard)`
  padding: 12px;
`

const DataCard = ({ tierData }: { tierData: TierData }) => {
  return (
    <Container to={'pools/' + tierData.poolId + '/tiers/' + tierData.tierId}>
      <Wrapper>
        <AutoColumn gap="sm">
          <RowFixed>
            <DoubleCurrencyLogo
              address0={tierData.pool.token0.address}
              address1={tierData.pool.token1.address}
              size={16}
            />
            <TYPE.label ml="8px">
              <HoverInlineText
                maxCharacters={10}
                text={`${tierData.pool.token0.symbol}/${tierData.pool.token1.symbol}`}
              />
            </TYPE.label>
            <GreyBadge ml="10px" fontSize="12px">
              {feeTierPercent(tierData.feeTier)}
            </GreyBadge>
          </RowFixed>
          <RowFixed>
            <TYPE.label mr="6px">{formatDollarAmount(tierData.volumeUSD)}</TYPE.label>
            <Percent fontSize="14px" value={tierData.volumeUSDChange} />
          </RowFixed>
        </AutoColumn>
      </Wrapper>
    </Container>
  )
}

export default function TopTierMovers() {
  const allTiers = useAllTierData()

  const topVolume = useMemo(() => {
    return Object.values(allTiers)
      .sort(({ data: a }, { data: b }) => {
        return a && b ? (a?.volumeUSDChange > b?.volumeUSDChange ? -1 : 1) : -1
      })
      .slice(0, Math.min(20, Object.values(allTiers).length))
  }, [allTiers])

  if (Object.keys(allTiers).length === 0) {
    return <Loader />
  }

  return (
    <ScrollableX>
      {topVolume.map((entry) =>
        entry.data ? (
          <DataCard
            key={'top-card-tiers-' + entry.data.poolId + '-' + entry.data.tierId.toString()}
            tierData={entry.data}
          />
        ) : null
      )}
    </ScrollableX>
  )
}
