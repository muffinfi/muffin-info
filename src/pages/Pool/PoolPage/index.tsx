import { ButtonGray, ButtonPrimary, SavedIcon } from 'components/Button'
import { DarkGreyCard, GreyBadge } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader, { LocalLoader } from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import Percent from 'components/Percent'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import TierTable from 'components/tiers/TierTable'
import TransactionTable from 'components/TransactionsTable'
import { EthereumNetworkInfo } from 'constants/networks'
import { useColor } from 'hooks/useColor'
import { PageWrapper } from 'pages/styled'
import React, { useEffect, useMemo } from 'react'
import { Download } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { usePoolDatas, usePoolTransactions } from 'state/pools/hooks'
import { useTierDatas } from 'state/tiers/hooks'
import { normalizeKey } from 'state/tiers/utils'
import { useSavedPools } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink, TYPE } from 'theme'
import { feeTierPercent } from 'utils'
import { networkPrefix } from 'utils/networkPrefix'
import { formatAmount, formatDollarAmount } from 'utils/numbers'
import { ExternalLink as StyledExternalLink } from 'theme/components'
import PoolCharts from './PoolCharts'

const TitleRow = styled(RowBetween)`
  position: sticky;
  top: 70px;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  background-color: #1f212840;
  backdrop-filter: blur(22px);
  z-index: 999999;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    position: relative
    top: initial;
    padding-top: 0;
    padding-bottom: 0;
    backdrop-filter: none;

    flex-direction: column;
    align-items: flex-start;
    row-gap: 24px;
    width: 100%:
  `};
`

const TierBadgeLink = styled(StyledInternalLink)`
  :hover {
    opacity: 0.6;
  }
`

const InfoRow = styled(Row)`
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: 32px;
  row-gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: stretch
  `};

  & > ${DarkGreyCard} {
    min-height: 112px;
    ${({ theme }) => theme.mediaWidth.upToSmall`
      min-height: initial;
    `};
  }
`

const SubInfoRow = styled(Row)`
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: 80px;
  row-gap: 32px;
  justify-content: space-between;

  @media (max-width: 1300px) {
    column-gap: 56px;
  }
  @media (max-width: 1200px) {
    column-gap: 40px;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    column-gap: 32px;
  `};
`

export default function PoolPage({
  match: {
    params: { poolId },
  },
}: RouteComponentProps<{ poolId: string }>) {
  const [activeNetwork] = useActiveNetworkVersion()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()

  // token data
  const poolData = usePoolDatas([poolId])[0]
  const transactions = usePoolTransactions(poolId)

  // tiers data
  const tierKeys = useMemo(() => poolData?.tiers.map((t) => normalizeKey([poolData.poolId, t.tierId])), [poolData])
  const tierDatas = useTierDatas(tierKeys)

  //watchlist
  const [savedPools, addSavedPool] = useSavedPools()

  if (poolData == null) {
    return (
      <PageWrapper>
        <Loader />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <AutoColumn gap="32px">
        <RowBetween>
          <AutoRow gap="4px">
            <StyledInternalLink to={networkPrefix(activeNetwork)}>
              <TYPE.main>{`Home > `}</TYPE.main>
            </StyledInternalLink>
            <StyledInternalLink to={networkPrefix(activeNetwork) + 'pools'}>
              <TYPE.label>{` Pools `}</TYPE.label>
            </StyledInternalLink>
            <TYPE.main>{` > `}</TYPE.main>
            <TYPE.label>{` ${poolData.token0.symbol} / ${poolData.token1.symbol} `}</TYPE.label>
          </AutoRow>
          <RowFixed gap="10px" align="center">
            <SavedIcon fill={savedPools.includes(poolId)} onClick={() => addSavedPool(poolId)} />
          </RowFixed>
        </RowBetween>

        {/* Title and buttons */}
        <TitleRow>
          <AutoColumn gap="lg">
            <RowFixed>
              <DoubleCurrencyLogo address0={poolData.token0.address} address1={poolData.token1.address} size={24} />
              <TYPE.label
                ml="8px"
                mr="8px"
                fontSize="24px"
              >{` ${poolData.token0.symbol} / ${poolData.token1.symbol} `}</TYPE.label>
              {/* <GreyBadge>{feeTierPercent(poolData.feeTier)}</GreyBadge> */}
              {activeNetwork === EthereumNetworkInfo ? null : (
                <GenericImageWrapper src={activeNetwork.imageURL} style={{ marginLeft: '8px' }} size={'26px'} />
              )}
            </RowFixed>
          </AutoColumn>
          {activeNetwork !== EthereumNetworkInfo ? null : (
            <RowFixed>
              <StyledExternalLink
                href={`https://app.uniswap.org/#/add/${poolData.token0.address}/${poolData.token1.address}`}
              >
                <ButtonGray width="170px" mr="12px" style={{ height: '44px' }}>
                  <RowBetween>
                    <Download size={24} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>Add Liquidity</div>
                  </RowBetween>
                </ButtonGray>
              </StyledExternalLink>
              <StyledExternalLink
                href={`https://app.uniswap.org/#/swap?inputCurrency=${poolData.token0.address}&outputCurrency=${poolData.token1.address}`}
              >
                <ButtonPrimary width="100px" style={{ height: '44px' }}>
                  Trade
                </ButtonPrimary>
              </StyledExternalLink>
            </RowFixed>
          )}
        </TitleRow>

        {/* General info */}
        <InfoRow>
          {/* tiers card */}
          <DarkGreyCard width="auto" padding="1rem 1.5rem 1.5rem">
            <AutoColumn gap="10px">
              <TYPE.main fontWeight={400}>Existing Tiers</TYPE.main>
              <Row style={{ flexWrap: 'wrap', gap: 12, maxWidth: 280 }}>
                {poolData.tiers.map((tier) => (
                  <TierBadgeLink
                    key={tier.tierId}
                    to={networkPrefix(activeNetwork) + 'pools/' + poolId + '/tiers/' + tier.tierId}
                  >
                    <GreyBadge fontSize={15}>{feeTierPercent(tier.feeTier)}</GreyBadge>
                  </TierBadgeLink>
                ))}
              </Row>
            </AutoColumn>
          </DarkGreyCard>

          {/* General info card */}
          <DarkGreyCard width="auto" padding="1rem 3rem 1rem 1.5rem">
            <SubInfoRow>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>TVL</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(poolData.tvlUSD)}</TYPE.label>
                <Percent value={poolData.tvlUSDChange} />
              </AutoColumn>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>Volume 24h</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(poolData.volumeUSD)}</TYPE.label>
                <Percent value={poolData.volumeUSDChange} />
              </AutoColumn>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>Fees 24h</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(poolData.feesUSD)}</TYPE.label>
              </AutoColumn>
            </SubInfoRow>
          </DarkGreyCard>

          {/* Token qty card */}
          <DarkGreyCard width="auto" padding="1rem 1.5rem">
            <AutoColumn gap="0.75rem">
              <TYPE.main fontWeight={400}>Total Tokens Locked</TYPE.main>
              <RowBetween>
                <RowFixed>
                  <CurrencyLogo address={poolData.token0.address} size={'19px'} />
                  <TYPE.label fontSize="15px" ml="8px">
                    {poolData.token0.symbol}
                  </TYPE.label>
                </RowFixed>
                <TYPE.label fontSize="15px">{formatAmount(poolData.tvlToken0)}</TYPE.label>
              </RowBetween>
              <RowBetween>
                <RowFixed>
                  <CurrencyLogo address={poolData.token1.address} size={'19px'} />
                  <TYPE.label fontSize="15px" ml="8px">
                    {poolData.token1.symbol}
                  </TYPE.label>
                </RowFixed>
                <TYPE.label fontSize="15px">{formatAmount(poolData.tvlToken1)}</TYPE.label>
              </RowBetween>
            </AutoColumn>
          </DarkGreyCard>
        </InfoRow>

        {/* Charts */}
        <PoolCharts poolId={poolId} color={backgroundColor} />

        {/* Tiers table */}
        <TYPE.main fontSize="24px">All tiers</TYPE.main>
        <DarkGreyCard>{tierDatas ? <TierTable tierDatas={tierDatas} /> : <LocalLoader fill={false} />}</DarkGreyCard>

        {/* Transaction */}
        <TYPE.main fontSize="24px">Transactions</TYPE.main>
        <DarkGreyCard>
          {transactions ? <TransactionTable transactions={transactions} /> : <LocalLoader fill={false} />}
        </DarkGreyCard>
      </AutoColumn>
    </PageWrapper>
  )
}
