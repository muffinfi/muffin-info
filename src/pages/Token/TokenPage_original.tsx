import BarChart from 'components/BarChart/alt'
import { ButtonGray, ButtonPrimary, SavedIcon } from 'components/Button'
import CandleChart from 'components/CandleChart'
import { DarkGreyCard, LightGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import LineChart from 'components/LineChart/alt'
import Loader, { LocalLoader } from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import Percent from 'components/Percent'
import PoolTable from 'components/pools/PoolTable'
import { AutoRow, RowBetween, RowFixed, RowFlat } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
import TransactionTable from 'components/TransactionsTable'
import { ONE_HOUR_SECONDS, TimeWindow } from 'constants/intervals'
import { EthereumNetworkInfo } from 'constants/networks'
import dayjs from 'dayjs'
// import { SmallOptionButton } from '../../components/Button'
import { useCMCLink } from 'hooks/useCMCLink'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { PageWrapper, ThemedBackground } from 'pages/styled'
import React, { useEffect, useMemo, useState } from 'react'
import { Download, ExternalLink } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { usePoolDatas } from 'state/pools/hooks'
import {
  usePoolsForToken,
  useTokenChartData,
  useTokenData,
  useTokenPriceData,
  useTokenTransactions,
} from 'state/tokens/hooks'
import { useSavedTokens } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink, TYPE } from 'theme'
import { currentTimestamp, getEtherscanLink, shortenAddress } from 'utils'
import { unixToDate } from 'utils/date'
import { networkPrefix } from 'utils/networkPrefix'
import { formatDollarAmount } from 'utils/numbers'
import CMCLogo from '../../assets/images/cmc.png'
import { ExternalLink as StyledExternalLink } from '../../theme/components'

const PriceText = styled(TYPE.label)`
  font-size: 36px;
  line-height: 0.8;
`

const ContentLayout = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-gap: 1em;

  @media screen and (max-width: 800px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
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

const StyledCMCLogo = styled.img`
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`

enum ChartView {
  TVL,
  VOL,
  PRICE,
}

const DEFAULT_TIME_WINDOW = TimeWindow.WEEK

export default function TokenPage({
  match: {
    params: { address },
  },
}: RouteComponentProps<{ address: string }>) {
  const [activeNetwork] = useActiveNetworkVersion()

  address = address.toLowerCase()
  // theming
  const backgroundColor = useColor(address)
  const theme = useTheme()

  // scroll on page view
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const tokenData = useTokenData(address)
  const poolsForToken = usePoolsForToken(address)
  const poolDatas = usePoolDatas(poolsForToken ?? [])
  const transactions = useTokenTransactions(address)
  const chartData = useTokenChartData(address)

  // check for link to CMC
  const cmcLink = useCMCLink(address)

  // format for chart component
  const formattedTvlData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.totalValueLockedUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedVolumeData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.volumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  // chart labels
  const [view, setView] = useState(ChartView.PRICE)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  const [timeWindow] = useState(DEFAULT_TIME_WINDOW)

  // pricing data
  const priceData = useTokenPriceData(address, ONE_HOUR_SECONDS, timeWindow)
  const adjustedToCurrent = useMemo(() => {
    if (priceData && tokenData && priceData.length > 0) {
      const adjusted = Object.assign([], priceData)
      adjusted.push({
        time: currentTimestamp() / 1000,
        open: priceData[priceData.length - 1].close,
        close: tokenData?.priceUSD,
        high: tokenData?.priceUSD,
        low: priceData[priceData.length - 1].close,
      })
      return adjusted
    } else {
      return undefined
    }
  }, [priceData, tokenData])

  // watchlist
  const [savedTokens, addSavedToken] = useSavedTokens()

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={backgroundColor} />
      {tokenData ? (
        !tokenData.exists ? (
          <LightGreyCard style={{ textAlign: 'center' }}>
            No pool has been created with this token yet. Create one
            <StyledExternalLink style={{ marginLeft: '4px' }} href={`https://app.uniswap.org/#/add/${address}`}>
              here.
            </StyledExternalLink>
          </LightGreyCard>
        ) : (
          <AutoColumn gap="32px">
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
              <ResponsiveRow align="flex-end">
                <AutoColumn gap="md">
                  <RowFixed gap="lg">
                    <CurrencyLogo address={address} />
                    <TYPE.label ml={'10px'} fontSize="20px">
                      {tokenData.name}
                    </TYPE.label>
                    <TYPE.main ml={'6px'} fontSize="20px">
                      ({tokenData.symbol})
                    </TYPE.main>
                    {activeNetwork === EthereumNetworkInfo ? null : (
                      <GenericImageWrapper src={activeNetwork.imageURL} style={{ marginLeft: '8px' }} size={'26px'} />
                    )}
                  </RowFixed>
                  <RowFlat style={{ marginTop: '8px' }}>
                    <PriceText mr="10px"> {formatDollarAmount(tokenData.priceUSD)}</PriceText>
                    (<Percent value={tokenData.priceUSDChange} />)
                  </RowFlat>
                </AutoColumn>
                {activeNetwork !== EthereumNetworkInfo ? null : (
                  <RowFixed>
                    <StyledExternalLink href={`https://app.uniswap.org/#/add/${address}`}>
                      <ButtonGray width="170px" mr="12px" height={'100%'} style={{ height: '44px' }}>
                        <RowBetween>
                          <Download size={24} />
                          <div style={{ display: 'flex', alignItems: 'center' }}>Add Liquidity</div>
                        </RowBetween>
                      </ButtonGray>
                    </StyledExternalLink>
                    <StyledExternalLink href={`https://app.uniswap.org/#/swap?inputCurrency=${address}`}>
                      <ButtonPrimary width="100px" bgColor={backgroundColor} style={{ height: '44px' }}>
                        Trade
                      </ButtonPrimary>
                    </StyledExternalLink>
                  </RowFixed>
                )}
              </ResponsiveRow>
            </AutoColumn>
            <ContentLayout>
              <DarkGreyCard>
                <AutoColumn gap="lg">
                  <AutoColumn gap="4px">
                    <TYPE.main fontWeight={400}>TVL</TYPE.main>
                    <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.tvlUSD)}</TYPE.label>
                    <Percent value={tokenData.tvlUSDChange} />
                  </AutoColumn>
                  <AutoColumn gap="4px">
                    <TYPE.main fontWeight={400}>24h Trading Vol</TYPE.main>
                    <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.volumeUSD)}</TYPE.label>
                    <Percent value={tokenData.volumeUSDChange} />
                  </AutoColumn>
                  <AutoColumn gap="4px">
                    <TYPE.main fontWeight={400}>7d Trading Vol</TYPE.main>
                    <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.volumeUSDWeek)}</TYPE.label>
                  </AutoColumn>
                  <AutoColumn gap="4px">
                    <TYPE.main fontWeight={400}>24h Fees</TYPE.main>
                    <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.feesUSD)}</TYPE.label>
                  </AutoColumn>
                </AutoColumn>
              </DarkGreyCard>
              <DarkGreyCard>
                <RowBetween align="flex-start">
                  <AutoColumn>
                    <RowFixed>
                      <TYPE.label fontSize="24px" height="30px">
                        <MonoSpace>
                          {latestValue
                            ? formatDollarAmount(latestValue, 2)
                            : view === ChartView.VOL
                            ? formatDollarAmount(formattedVolumeData[formattedVolumeData.length - 1]?.value)
                            : view === ChartView.TVL
                            ? formatDollarAmount(formattedTvlData[formattedTvlData.length - 1]?.value)
                            : formatDollarAmount(tokenData.priceUSD, 2)}
                        </MonoSpace>
                      </TYPE.label>
                    </RowFixed>
                    <TYPE.main height="20px" fontSize="12px">
                      {valueLabel ? (
                        <MonoSpace>{valueLabel} (UTC)</MonoSpace>
                      ) : (
                        <MonoSpace>{dayjs.utc().format('MMM D, YYYY')}</MonoSpace>
                      )}
                    </TYPE.main>
                  </AutoColumn>
                  <ToggleWrapper width="180px">
                    <ToggleElementFree
                      isActive={view === ChartView.VOL}
                      fontSize="12px"
                      onClick={() => (view === ChartView.VOL ? setView(ChartView.TVL) : setView(ChartView.VOL))}
                    >
                      Volume
                    </ToggleElementFree>
                    <ToggleElementFree
                      isActive={view === ChartView.TVL}
                      fontSize="12px"
                      onClick={() => (view === ChartView.TVL ? setView(ChartView.PRICE) : setView(ChartView.TVL))}
                    >
                      TVL
                    </ToggleElementFree>
                    <ToggleElementFree
                      isActive={view === ChartView.PRICE}
                      fontSize="12px"
                      onClick={() => setView(ChartView.PRICE)}
                    >
                      Price
                    </ToggleElementFree>
                  </ToggleWrapper>
                </RowBetween>
                {view === ChartView.TVL ? (
                  <LineChart
                    data={formattedTvlData}
                    color={backgroundColor}
                    minHeight={340}
                    value={latestValue}
                    label={valueLabel}
                    setValue={setLatestValue}
                    setLabel={setValueLabel}
                  />
                ) : view === ChartView.VOL ? (
                  <BarChart
                    data={formattedVolumeData}
                    color={backgroundColor}
                    minHeight={340}
                    value={latestValue}
                    label={valueLabel}
                    setValue={setLatestValue}
                    setLabel={setValueLabel}
                  />
                ) : view === ChartView.PRICE ? (
                  adjustedToCurrent ? (
                    <CandleChart
                      data={adjustedToCurrent}
                      setValue={setLatestValue}
                      setLabel={setValueLabel}
                      color={backgroundColor}
                    />
                  ) : (
                    <LocalLoader fill={false} />
                  )
                ) : null}
                {/* <RowBetween width="100%">
                  <div> </div>
                  <AutoRow gap="4px" width="fit-content">
                    <SmallOptionButton
                      active={timeWindow === TimeWindow.DAY}
                      onClick={() => setTimeWindow(TimeWindow.DAY)}
                    >
                      24H
                    </SmallOptionButton>
                    <SmallOptionButton
                      active={timeWindow === TimeWindow.WEEK}
                      onClick={() => setTimeWindow(TimeWindow.WEEK)}
                    >
                      1W
                    </SmallOptionButton>
                    <SmallOptionButton
                      active={timeWindow === TimeWindow.MONTH}
                      onClick={() => setTimeWindow(TimeWindow.MONTH)}
                    >
                      1M
                    </SmallOptionButton>
                    <SmallOptionButton
                      active={timeWindow === TimeWindow.DAY}
                      onClick={() => setTimeWindow(TimeWindow.DAY)}
                    >
                      All
                    </SmallOptionButton>
                  </AutoRow>
                </RowBetween> */}
              </DarkGreyCard>
            </ContentLayout>
            <TYPE.main>Pools</TYPE.main>
            <DarkGreyCard>
              <PoolTable poolDatas={poolDatas} />
            </DarkGreyCard>
            <TYPE.main>Transactions</TYPE.main>
            <DarkGreyCard>
              {transactions ? (
                <TransactionTable transactions={transactions} color={backgroundColor} />
              ) : (
                <LocalLoader fill={false} />
              )}
            </DarkGreyCard>
          </AutoColumn>
        )
      ) : (
        <Loader />
      )}
    </PageWrapper>
  )
}
