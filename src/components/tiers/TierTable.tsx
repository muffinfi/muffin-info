import { DarkGreyCard, GreyBadge } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader, { LoadingRows } from 'components/Loader'
import { RowFixed } from 'components/Row'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import useTheme from 'hooks/useTheme'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { TierData } from 'state/tiers/reducer'
import styled from 'styled-components'
import { TYPE } from 'theme'
import { feeTierPercent } from 'utils'
import getValue from 'utils/getValue'
import { networkPrefix } from 'utils/networkPrefix'
import { formatDollarAmount } from 'utils/numbers'
import { TOKEN_HIDE } from '../../constants/index'

const Wrapper = styled(DarkGreyCard)`
  width: 100%;
`

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  align-items: center;

  grid-template-columns: 20px 1.5fr 2fr repeat(3, 1fr);

  @media screen and (max-width: 900px) {
    grid-template-columns: 20px 1.5fr repeat(2, 1fr);
    & :nth-child(4),
    & :nth-child(6) {
      display: none;
    }
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: 2.5fr repeat(1, 1fr);
    > *:nth-child(1),
    > *:nth-child(3) {
      display: none;
    }
  }
`

const LinkWrapper = styled(Link)`
  text-decoration: none;
  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

type TierDataKey = keyof TierData

const SORT_FIELD = {
  pool: 'token0.symbol',
  feeTier: 'feeTier',
  volumeUSD: 'volumeUSD',
  tvlUSD: 'tvlUSD',
  volumeUSDWeek: 'volumeUSDWeek',
}

const DataRow = ({ tierData, index }: { tierData: TierData; index: number }) => {
  const [activeNetwork] = useActiveNetworkVersion()

  return (
    <LinkWrapper to={networkPrefix(activeNetwork) + 'pools/' + tierData.poolId + '/tiers/' + tierData.tierId}>
      <ResponsiveGrid>
        <Label fontWeight={400}>{index + 1}</Label>
        <Label fontWeight={400}>
          <RowFixed>
            <DoubleCurrencyLogo address0={tierData.pool.token0.address} address1={tierData.pool.token1.address} />
            <TYPE.label ml="8px" style={{ whiteSpace: 'nowrap' }}>
              <HoverInlineText text={`${tierData.pool.token0.symbol} / ${tierData.pool.token1.symbol}`} />
            </TYPE.label>
          </RowFixed>
        </Label>
        <Label fontWeight={400}>
          <GreyBadge fontSize="14px">{feeTierPercent(tierData.feeTier)}</GreyBadge>
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(tierData.tvlUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(tierData.volumeUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(tierData.volumeUSDWeek)}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

const MAX_ITEMS = 10

export default function TierTable({ tierDatas, maxItems = MAX_ITEMS }: { tierDatas: TierData[]; maxItems?: number }) {
  // theming
  const theme = useTheme()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.tvlUSD)
  const [sortDirection, setSortDirection] = useState<boolean>(true)

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  useEffect(() => {
    let extraPages = 1
    if (tierDatas.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(tierDatas.length / maxItems) + extraPages)
  }, [maxItems, tierDatas])

  const sortedTiers = useMemo(() => {
    return (
      tierDatas
        ?.filter(
          (x) => !!x && !(TOKEN_HIDE.includes(x.pool.token0.address) || TOKEN_HIDE.includes(x.pool.token1.address))
        )
        .sort((a, b) => {
          if (a && b) {
            return getValue(a, sortField) > getValue(b, sortField)
              ? (sortDirection ? -1 : 1) * 1
              : (sortDirection ? -1 : 1) * -1
          } else {
            return -1
          }
        })
        .slice(maxItems * (page - 1), page * maxItems) ?? []
    )
  }, [maxItems, page, tierDatas, sortDirection, sortField])

  const handleSort = useCallback(
    (newField: string) => {
      setSortField(newField)
      setSortDirection(sortField !== newField ? true : !sortDirection)
    },
    [sortDirection, sortField]
  )

  const arrow = useCallback(
    (field: string) => {
      return sortField === field ? (!sortDirection ? '↑' : '↓') : ''
    },
    [sortDirection, sortField]
  )

  if (!tierDatas) {
    return <Loader />
  }

  return (
    <Wrapper>
      {sortedTiers.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <Label color={theme.text2}>#</Label>
            <ClickableText color={theme.text2} onClick={() => handleSort(SORT_FIELD.pool)}>
              Pool {arrow(SORT_FIELD.pool)}
            </ClickableText>
            <ClickableText color={theme.text2} onClick={() => handleSort(SORT_FIELD.feeTier)}>
              Tier {arrow(SORT_FIELD.feeTier)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.tvlUSD)}>
              TVL {arrow(SORT_FIELD.tvlUSD)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.volumeUSD)}>
              Volume 24H {arrow(SORT_FIELD.volumeUSD)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.volumeUSDWeek)}>
              Volume 7D {arrow(SORT_FIELD.volumeUSDWeek)}
            </ClickableText>
          </ResponsiveGrid>
          <Break />
          {sortedTiers.map(
            (tierData, i) =>
              tierData && (
                <React.Fragment key={i}>
                  <DataRow index={(page - 1) * MAX_ITEMS + i} tierData={tierData} />
                  <Break />
                </React.Fragment>
              )
          )}
          <PageButtons>
            <div
              onClick={() => {
                setPage(page === 1 ? page : page - 1)
              }}
            >
              <Arrow faded={page === 1 ? true : false}>←</Arrow>
            </div>
            <TYPE.body>{'Page ' + page + ' of ' + maxPage}</TYPE.body>
            <div
              onClick={() => {
                setPage(page === maxPage ? page : page + 1)
              }}
            >
              <Arrow faded={page === maxPage ? true : false}>→</Arrow>
            </div>
          </PageButtons>
        </AutoColumn>
      ) : (
        <LoadingRows>
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </LoadingRows>
      )}
    </Wrapper>
  )
}
