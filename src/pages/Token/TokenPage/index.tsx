import { ButtonGray, ButtonPrimary, SavedIcon } from 'components/Button'
import { DarkGreyCard, LightGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader, { LocalLoader } from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import Percent from 'components/Percent'
import PoolTable from 'components/pools/PoolTable'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import TransactionTable from 'components/TransactionsTable'
import { EthereumNetworkInfo } from 'constants/networks'
// import { SmallOptionButton } from '../../components/Button'
import CMCLogo from 'assets/images/cmc.png'
import { useCMCLink } from 'hooks/useCMCLink'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { PageWrapper } from 'pages/styled'
import React, { useEffect } from 'react'
import { Download, ExternalLink } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { usePoolDatas } from 'state/pools/hooks'
import { usePoolsForToken, useTokenData, useTokenTransactions } from 'state/tokens/hooks'
import { useSavedTokens } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink, TYPE } from 'theme'
import { ExternalLink as StyledExternalLink } from 'theme/components'
import { getEtherscanLink, shortenAddress } from 'utils'
import { networkPrefix } from 'utils/networkPrefix'
import { formatDollarAmount, formatDollarAmountDetailed } from 'utils/numbers'
import TokenCharts from './TokenCharts'

const StyledCMCLogo = styled.img`
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const TitleRow = styled(RowBetween)`
  position: sticky;
  top: 60px;
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

export default function TokenPage({
  match: {
    params: { address },
  },
}: RouteComponentProps<{ address: string }>) {
  const [activeNetwork] = useActiveNetworkVersion()

  address = address.toLowerCase()

  // theming
  const theme = useTheme()
  const buttonColor = useColor(address, theme.primary1)
  const backgroundColor = useColor(address, theme.secondary1)

  // scroll on page view
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const tokenData = useTokenData(address)
  const poolsForToken = usePoolsForToken(address)
  const poolDatas = usePoolDatas(poolsForToken ?? [])
  const transactions = useTokenTransactions(address)

  // check for link to CMC
  const cmcLink = useCMCLink(address)

  // watchlist
  const [savedTokens, addSavedToken] = useSavedTokens()

  if (tokenData == null) {
    return (
      <PageWrapper>
        <Loader />
      </PageWrapper>
    )
  }

  if (!tokenData.exists) {
    return (
      <PageWrapper>
        <LightGreyCard style={{ textAlign: 'center' }}>
          No pool has been created with this token yet. Create one
          <StyledExternalLink style={{ marginLeft: '4px' }} href={`https://muffin.fi/#/add/${address}`}>
            here.
          </StyledExternalLink>
        </LightGreyCard>
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
            <StyledInternalLink to={networkPrefix(activeNetwork) + 'tokens'}>
              <TYPE.label>{` Tokens `}</TYPE.label>
            </StyledInternalLink>
            <TYPE.main>{` > `}</TYPE.main>
            <TYPE.label>{` ${tokenData.symbol} `}</TYPE.label>
            <StyledExternalLink href={getEtherscanLink(1, address, 'address', activeNetwork)}>
              <TYPE.main>{` (${shortenAddress(address)}) `}</TYPE.main>
            </StyledExternalLink>
          </AutoRow>
          <RowFixed align="center" justify="center">
            <SavedIcon fill={savedTokens.includes(address)} onClick={() => addSavedToken(address)} />
            {cmcLink && (
              <StyledExternalLink
                href={cmcLink}
                style={{ marginLeft: '12px' }}
                onClickCapture={() => {
                  ReactGA.event({
                    category: 'CMC',
                    action: 'CMC token page click',
                  })
                }}
              >
                <StyledCMCLogo src={CMCLogo} />
              </StyledExternalLink>
            )}
            <StyledExternalLink href={getEtherscanLink(1, address, 'address', activeNetwork)}>
              <ExternalLink stroke={theme.text2} size={'17px'} style={{ marginLeft: '12px' }} />
            </StyledExternalLink>
          </RowFixed>
        </RowBetween>

        <TitleRow>
          <AutoColumn gap="md">
            <RowFixed gap="lg">
              <CurrencyLogo address={address} size="24px" />
              <TYPE.label ml={'10px'} fontSize="24px">
                {tokenData.name}
              </TYPE.label>
              <TYPE.main ml={'6px'} fontSize="24px">
                ({tokenData.symbol})
              </TYPE.main>
              {activeNetwork === EthereumNetworkInfo ? null : (
                <GenericImageWrapper src={activeNetwork.imageURL} style={{ marginLeft: '8px' }} size={'26px'} />
              )}
            </RowFixed>
          </AutoColumn>
          {activeNetwork !== EthereumNetworkInfo ? null : (
            <RowFixed>
              <StyledExternalLink href={`https://muffin.fi/#/add/${address}`}>
                <ButtonGray width="170px" mr="12px" height={'100%'} style={{ height: '44px' }}>
                  <RowBetween>
                    <Download size={24} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>Add Liquidity</div>
                  </RowBetween>
                </ButtonGray>
              </StyledExternalLink>
              <StyledExternalLink href={`https://muffin.fi/#/swap?inputCurrency=${address}`}>
                <ButtonPrimary width="100px" bgColor={buttonColor} style={{ height: '44px' }}>
                  Trade
                </ButtonPrimary>
              </StyledExternalLink>
            </RowFixed>
          )}
        </TitleRow>

        {/* General info */}
        <InfoRow>
          <DarkGreyCard width="auto" padding="1rem 2.5rem 1rem 1.5rem">
            <AutoColumn gap="6px">
              <TYPE.main fontWeight={400}>Price</TYPE.main>
              <TYPE.label fontSize="24px">{formatDollarAmountDetailed(tokenData.priceUSD)}</TYPE.label>
              <Percent value={tokenData.priceUSDChange} />
              {/* <RowFlat>
                <PriceText mr="10px">${formatAmountDetailed(tokenData.priceUSD)}</PriceText>
                (<Percent value={tokenData.priceUSDChange} />)
              </RowFlat> */}
            </AutoColumn>
          </DarkGreyCard>

          <DarkGreyCard width="auto" padding="1rem 3.5rem 1rem 1.5rem">
            <SubInfoRow>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>TVL</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.tvlUSD)}</TYPE.label>
                <Percent value={tokenData.tvlUSDChange} />
              </AutoColumn>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>24h Trading Vol</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.volumeUSD)}</TYPE.label>
                <Percent value={tokenData.volumeUSDChange} />
              </AutoColumn>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>7d Trading Vol</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.volumeUSDWeek)}</TYPE.label>
              </AutoColumn>
              <AutoColumn gap="6px">
                <TYPE.main fontWeight={400}>Fees 24h</TYPE.main>
                <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.feesUSD)}</TYPE.label>
              </AutoColumn>
            </SubInfoRow>
          </DarkGreyCard>
        </InfoRow>

        {/* Charts */}
        <TokenCharts address={address} color={backgroundColor} tokenData={tokenData} />

        {/* Pool table */}
        <TYPE.main>Pools</TYPE.main>
        <DarkGreyCard>
          <PoolTable poolDatas={poolDatas} />
        </DarkGreyCard>

        {/* Transactions */}
        <TYPE.main>Transactions</TYPE.main>
        <DarkGreyCard>
          {transactions ? (
            <TransactionTable transactions={transactions} color={backgroundColor} />
          ) : (
            <LocalLoader fill={false} />
          )}
        </DarkGreyCard>
      </AutoColumn>
    </PageWrapper>
  )
}
