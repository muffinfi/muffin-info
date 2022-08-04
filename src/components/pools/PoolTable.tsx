import { DarkGreyCard, GreyBadge } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader, { LoadingRows } from 'components/Loader'
import { AutoRow, RowFixed } from 'components/Row'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import useTheme from 'hooks/useTheme'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { PoolData } from 'state/pools/reducer'
import styled from 'styled-components/macro'
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

const SORT_FIELD = {
  pool: 'token0.symbol',
  feeTier: 'tiers.0.feeTier',
  volumeUSD: 'volumeUSD',
  tvlUSD: 'tvlUSD',
  volumeUSDWeek: 'volumeUSDWeek',
}

const DataRow = ({ poolData, index }: { poolData: PoolData; index: number }) => {
  const [activeNetwork] = useActiveNetworkVersion()

  return (
    <LinkWrapper to={networkPrefix(activeNetwork) + 'pools/' + poolData.poolId}>
      <ResponsiveGrid>
        <Label fontWeight={400}>{index + 1}</Label>
        <Label fontWeight={400}>
          <RowFixed>
            <DoubleCurrencyLogo address0={poolData.token0.address} address1={poolData.token1.address} />
            <TYPE.label ml="8px" style={{ whiteSpace: 'nowrap' }}>
              <HoverInlineText text={`${poolData.token0.symbol} / ${poolData.token1.symbol}`} />
            </TYPE.label>
          </RowFixed>
        </Label>
        <Label fontWeight={400}>
          <AutoRow gap="4px">
            {poolData.tiers.map((tier) => (
              <GreyBadge key={tier.tierId} ml="10px" fontSize="14px">
                {feeTierPercent(tier.feeTier)}
              </GreyBadge>
            ))}
          </AutoRow>
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(poolData.tvlUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(poolData.volumeUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(poolData.volumeUSDWeek)}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

const MAX_ITEMS = 10

export default function PoolTable({ poolDatas, maxItems = MAX_ITEMS }: { poolDatas: PoolData[]; maxItems?: number }) {
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
    if (poolDatas.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(poolDatas.length / maxItems) + extraPages)
  }, [maxItems, poolDatas])

  const sortedPools = useMemo(() => {
    return (
      poolDatas
        ?.filter((x) => !!x && !(TOKEN_HIDE.includes(x.token0.address) || TOKEN_HIDE.includes(x.token1.address)))
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
  }, [maxItems, page, poolDatas, sortDirection, sortField])

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

  if (!poolDatas) {
    return <Loader />
  }

  return (
    <Wrapper>
      {sortedPools.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <Label color={theme.text2}>#</Label>
            <ClickableText color={theme.text2} onClick={() => handleSort(SORT_FIELD.pool)}>
              Pool {arrow(SORT_FIELD.pool)}
            </ClickableText>
            <ClickableText color={theme.text2} onClick={() => handleSort(SORT_FIELD.feeTier)}>
              Tiers {arrow(SORT_FIELD.feeTier)}
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
          {sortedPools.map((poolData, i) => {
            if (poolData) {
              return (
                <React.Fragment key={i}>
                  <DataRow index={(page - 1) * MAX_ITEMS + i} poolData={poolData} />
                  <Break />
                </React.Fragment>
              )
            }
            return null
          })}
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
