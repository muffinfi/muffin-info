import { ButtonGray, ButtonPrimary, SavedIcon } from 'components/Button'
import { DarkGreyCard, GreyBadge, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader, { LocalLoader } from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import Percent from 'components/Percent'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import TransactionTable from 'components/TransactionsTable'
import { EthereumNetworkInfo } from 'constants/networks'
import { useColor } from 'hooks/useColor'
import { PageWrapper, ThemedBackground } from 'pages/styled'
import React, { useEffect } from 'react'
import { Download } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useTierDatas, useTierTransactions } from 'state/tiers/hooks'
import { normalizeKey } from 'state/tiers/utils'
import { useSavedTiers } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink, TYPE } from 'theme'
import { feeTierPercent } from 'utils'
import { networkPrefix } from 'utils/networkPrefix'
import { formatAmount, formatDollarAmount } from 'utils/numbers'
import { ExternalLink as StyledExternalLink } from '../../../theme/components'
import TierCharts from './TierCharts'

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-gap: 1em;

  @media screen and (max-width: 800px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
`

const TokenButton = styled(GreyCard)`
  padding: 8px 12px;
  border-radius: 10px;
  :hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 24px;
    width: 100%:
  `};
`

export default function TierPage({
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

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={backgroundColor} />
      {tierData == null ? (
        <Loader />
      ) : (
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
          <ResponsiveRow align="flex-end">
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
              <ResponsiveRow>
                <StyledInternalLink to={networkPrefix(activeNetwork) + 'tokens/' + tierData.pool.token0.address}>
                  <TokenButton>
                    <RowFixed>
                      <CurrencyLogo address={tierData.pool.token0.address} size={'20px'} />
                      <TYPE.label fontSize="16px" ml="4px" style={{ whiteSpace: 'nowrap' }} width={'fit-content'}>
                        {`1 ${tierData.pool.token0.symbol} =  ${formatAmount(tierData.token1Price, 4)} ${
                          tierData.pool.token1.symbol
                        }`}
                      </TYPE.label>
                    </RowFixed>
                  </TokenButton>
                </StyledInternalLink>
                <StyledInternalLink to={networkPrefix(activeNetwork) + 'tokens/' + tierData.pool.token1.address}>
                  <TokenButton ml="10px">
                    <RowFixed>
                      <CurrencyLogo address={tierData.pool.token1.address} size={'20px'} />
                      <TYPE.label fontSize="16px" ml="4px" style={{ whiteSpace: 'nowrap' }} width={'fit-content'}>
                        {`1 ${tierData.pool.token1.symbol} =  ${formatAmount(tierData.token0Price, 4)} ${
                          tierData.pool.token0.symbol
                        }`}
                      </TYPE.label>
                    </RowFixed>
                  </TokenButton>
                </StyledInternalLink>
              </ResponsiveRow>
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
          </ResponsiveRow>
          <ContentLayout>
            <DarkGreyCard>
              <AutoColumn gap="lg">
                <GreyCard padding="16px">
                  <AutoColumn gap="md">
                    <TYPE.main>Total Tokens Locked</TYPE.main>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo address={tierData.pool.token0.address} size={'20px'} />
                        <TYPE.label fontSize="14px" ml="8px">
                          {tierData.pool.token0.symbol}
                        </TYPE.label>
                      </RowFixed>
                      <TYPE.label fontSize="14px">{formatAmount(tierData.tvlToken0)}</TYPE.label>
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo address={tierData.pool.token1.address} size={'20px'} />
                        <TYPE.label fontSize="14px" ml="8px">
                          {tierData.pool.token1.symbol}
                        </TYPE.label>
                      </RowFixed>
                      <TYPE.label fontSize="14px">{formatAmount(tierData.tvlToken1)}</TYPE.label>
                    </RowBetween>
                  </AutoColumn>
                </GreyCard>
                <AutoColumn gap="4px">
                  <TYPE.main fontWeight={400}>TVL</TYPE.main>
                  <TYPE.label fontSize="24px">{formatDollarAmount(tierData.tvlUSD)}</TYPE.label>
                  <Percent value={tierData.tvlUSDChange} />
                </AutoColumn>
                <AutoColumn gap="4px">
                  <TYPE.main fontWeight={400}>Volume 24h</TYPE.main>
                  <TYPE.label fontSize="24px">{formatDollarAmount(tierData.volumeUSD)}</TYPE.label>
                  <Percent value={tierData.volumeUSDChange} />
                </AutoColumn>
                <AutoColumn gap="4px">
                  <TYPE.main fontWeight={400}>24h Fees</TYPE.main>
                  <TYPE.label fontSize="24px">{formatDollarAmount(tierData.feesUSD)}</TYPE.label>
                </AutoColumn>
              </AutoColumn>
            </DarkGreyCard>
            <TierCharts tierKey={tierKey} color={backgroundColor} activeNetwork={activeNetwork} tierData={tierData} />
          </ContentLayout>
          <TYPE.main fontSize="24px">Transactions</TYPE.main>
          <DarkGreyCard>
            {transactions ? <TransactionTable transactions={transactions} /> : <LocalLoader fill={false} />}
          </DarkGreyCard>
        </AutoColumn>
      )}
    </PageWrapper>
  )
}
