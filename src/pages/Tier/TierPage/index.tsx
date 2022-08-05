import { ButtonGray, ButtonPrimary, SavedIcon } from 'components/Button'
import { DarkGreyCard, GreyBadge } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader, { LocalLoader } from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import Percent from 'components/Percent'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import TransactionTable from 'components/TransactionsTable'
import { EthereumNetworkInfo } from 'constants/networks'
import { useColor } from 'hooks/useColor'
import { PageWrapper } from 'pages/styled'
import React, { useEffect } from 'react'
import { Download } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useTierDatas, useTierTransactions } from 'state/tiers/hooks'
import { normalizeKey } from 'state/tiers/utils'
import { useSavedTiers } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink, TYPE } from 'theme'
import { ExternalLink as StyledExternalLink } from 'theme/components'
import { feeTierPercent } from 'utils'
import { networkPrefix } from 'utils/networkPrefix'
import { formatAmount, formatAmountDetailed, formatDollarAmount } from 'utils/numbers'
import TierCharts3 from './TierCharts'

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

const TokenRateLink = styled(StyledInternalLink)`
  :hover {
    opacity: 0.6;
  }
`

const InfoRow = styled(Row)`
  flex-wrap: wrap;
  align-items: stretch;
  column-gap: 32px;
  row-gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: stretch
  `};
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

export default function TierPage2({
  match: {
    params: { poolId, tierId },
  },
}: RouteComponentProps<{ poolId: string; tierId: string }>) {
  const [activeNetwork] = useActiveNetworkVersion()
  const parsedTierId = parseInt(tierId)
  const tierKey = normalizeKey([poolId, parsedTierId])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()

  // tier data
  const tierData = useTierDatas([tierKey])[0]
  const transactions = useTierTransactions(tierKey)

  //watchlist
  const [savedTiers, addSavedTier] = useSavedTiers()

  if (tierData == null) {
    return (
      <PageWrapper>
        <Loader />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <AutoColumn gap="32px">
        {/* Breadcrumb */}
        <RowBetween>
          <AutoRow gap="4px">
            <StyledInternalLink to={networkPrefix(activeNetwork)}>
              <TYPE.main>{`Home > `}</TYPE.main>
            </StyledInternalLink>
            <StyledInternalLink to={networkPrefix(activeNetwork) + 'pools'}>
              <TYPE.label>{` Pools `}</TYPE.label>
            </StyledInternalLink>
            <TYPE.main>{` > `}</TYPE.main>
            <StyledInternalLink to={networkPrefix(activeNetwork) + 'pools/' + tierData.poolId}>
              <TYPE.label>{` ${tierData.pool.token0.symbol} / ${tierData.pool.token1.symbol} `}</TYPE.label>
            </StyledInternalLink>
            <TYPE.main>{` > `}</TYPE.main>
            <TYPE.label>{` ${feeTierPercent(tierData.feeTier)} `}</TYPE.label>
          </AutoRow>
          <RowFixed gap="10px" align="center">
            <SavedIcon fill={savedTiers.includes(tierKey)} onClick={() => addSavedTier(tierKey)} />
          </RowFixed>
        </RowBetween>

        {/* Title and buttons */}
        <TitleRow>
          <AutoColumn gap="lg">
            <RowFixed>
              <DoubleCurrencyLogo
                address0={tierData.pool.token0.address}
                address1={tierData.pool.token1.address}
                size={24}
              />
              <TYPE.label
                ml="8px"
                mr="8px"
                fontSize="24px"
              >{` ${tierData.pool.token0.symbol} / ${tierData.pool.token1.symbol} `}</TYPE.label>
              <GreyBadge>{feeTierPercent(tierData.feeTier)}</GreyBadge>
              {activeNetwork === EthereumNetworkInfo ? null : (
                <GenericImageWrapper src={activeNetwork.imageURL} style={{ marginLeft: '8px' }} size={'26px'} />
              )}
            </RowFixed>
          </AutoColumn>

          {activeNetwork !== EthereumNetworkInfo ? null : (
            <RowFixed>
              <StyledExternalLink
                href={`https://app.muffin.fi/#/add/${tierData.pool.token0.address}/${tierData.pool.token1.address}/${tierData.sqrtGamma}`}
              >
                <ButtonGray width="170px" mr="12px" style={{ height: '44px' }}>
                  <RowBetween>
                    <Download size={24} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>Add Liquidity</div>
                  </RowBetween>
                </ButtonGray>
              </StyledExternalLink>
              <StyledExternalLink
                href={`https://app.muffin.fi/#/swap?inputCurrency=${tierData.pool.token0.address}&outputCurrency=${tierData.pool.token1.address}`}
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
          {/* Price card */}
          <DarkGreyCard width="auto" padding="1rem 2.5rem 1rem 1.5rem">
            <AutoColumn gap="0.75rem">
              <TYPE.main fontWeight={400}>Current Rate</TYPE.main>
              <TokenRateLink to={networkPrefix(activeNetwork) + 'tokens/' + tierData.pool.token0.address}>
                <RowFixed>
                  <CurrencyLogo address={tierData.pool.token0.address} size={'19px'} />
                  <TYPE.label fontSize="15px" ml="8px" style={{ whiteSpace: 'nowrap' }}>
                    {`1 ${tierData.pool.token0.symbol}`}&nbsp;&nbsp;=&nbsp;&nbsp;
                    {`${formatAmountDetailed(tierData.token1Price)} ${tierData.pool.token1.symbol}`}
                  </TYPE.label>
                </RowFixed>
              </TokenRateLink>
              <TokenRateLink to={networkPrefix(activeNetwork) + 'tokens/' + tierData.pool.token1.address}>
                <RowFixed>
                  <CurrencyLogo address={tierData.pool.token1.address} size={'19px'} />
                  <TYPE.label fontSize="15px" ml="8px" style={{ whiteSpace: 'nowrap' }}>
                    {`1 ${tierData.pool.token1.symbol}`}&nbsp;&nbsp;=&nbsp;&nbsp;
                    {`${formatAmountDetailed(tierData.token0Price)} ${tierData.pool.token0.symbol}`}
                  </TYPE.label>
                </RowFixed>
              </TokenRateLink>
            </AutoColumn>
          </DarkGreyCard>

          {/* General info card */}
          <DarkGreyCard width="auto" padding="1rem 3rem 1rem 1.5rem">
            <SubInfoRow>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>TVL</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(tierData.tvlUSD)}</TYPE.label>
                <Percent value={tierData.tvlUSDChange} />
              </AutoColumn>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>Volume 24h</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(tierData.volumeUSD)}</TYPE.label>
                <Percent value={tierData.volumeUSDChange} />
              </AutoColumn>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>Fees 24h</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(tierData.feesUSD)}</TYPE.label>
              </AutoColumn>
            </SubInfoRow>
          </DarkGreyCard>

          {/* Token qty card */}
          <DarkGreyCard width="auto" padding="1rem 1.5rem">
            <AutoColumn gap="0.75rem">
              <TYPE.main fontWeight={400}>Total Tokens Locked</TYPE.main>
              <RowBetween>
                <RowFixed>
                  <CurrencyLogo address={tierData.pool.token0.address} size={'19px'} />
                  <TYPE.label fontSize="15px" ml="8px">
                    {tierData.pool.token0.symbol}
                  </TYPE.label>
                </RowFixed>
                <TYPE.label fontSize="15px">{formatAmount(tierData.tvlToken0)}</TYPE.label>
              </RowBetween>
              <RowBetween>
                <RowFixed>
                  <CurrencyLogo address={tierData.pool.token1.address} size={'19px'} />
                  <TYPE.label fontSize="15px" ml="8px">
                    {tierData.pool.token1.symbol}
                  </TYPE.label>
                </RowFixed>
                <TYPE.label fontSize="15px">{formatAmount(tierData.tvlToken1)}</TYPE.label>
              </RowBetween>
            </AutoColumn>
          </DarkGreyCard>
        </InfoRow>

        {/* Charts */}
        <TierCharts3 tierKey={tierKey} color={backgroundColor} activeNetwork={activeNetwork} tierData={tierData} />

        {/* Transactions */}
        <TYPE.main fontSize="24px">Transactions</TYPE.main>
        <DarkGreyCard>
          {transactions ? <TransactionTable transactions={transactions} /> : <LocalLoader fill={false} />}
        </DarkGreyCard>
      </AutoColumn>
    </PageWrapper>
  )
}
