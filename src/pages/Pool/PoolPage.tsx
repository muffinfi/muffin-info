import BarChart from 'components/BarChart/alt'
import { ButtonGray, ButtonPrimary, SavedIcon } from 'components/Button'
import { DarkGreyCard, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DensityChart from 'components/DensityChart/alt'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import LineChart from 'components/LineChart/alt'
import Loader, { LocalLoader } from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import Percent from 'components/Percent'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import TierTable from 'components/tiers/TierTable'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
import TransactionTable from 'components/TransactionsTable'
import { ArbitrumNetworkInfo, EthereumNetworkInfo } from 'constants/networks'
import { useColor } from 'hooks/useColor'
import { PageWrapper, ThemedBackground } from 'pages/styled'
import React, { useEffect, useMemo, useState } from 'react'
import { Download } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { usePoolChartData, usePoolDatas, usePoolTransactions } from 'state/pools/hooks'
import { useTierDatas } from 'state/tiers/hooks'
import { normalizeKey } from 'state/tiers/utils'
import { useSavedPools } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink, TYPE } from 'theme'
import { unixToDate } from 'utils/date'
import { networkPrefix } from 'utils/networkPrefix'
import { formatAmount, formatDollarAmount } from 'utils/numbers'
import { ExternalLink as StyledExternalLink } from '../../theme/components'

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
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

const ToggleRow = styled(RowBetween)`
  @media screen and (max-width: 600px) {
    flex-direction: column;
  }
`

enum ChartView {
  TVL,
  VOL,
  PRICE,
  DENSITY,
  FEES,
}

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
  const chartData = usePoolChartData(poolId)
  const transactions = usePoolTransactions(poolId)

  // tiers data
  const tierKeys = useMemo(() => poolData?.tiers.map((t) => normalizeKey([poolData.poolId, t.tierId])), [poolData])
  const tierDatas = useTierDatas(tierKeys)

  const [view, setView] = useState(ChartView.VOL)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()

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

  const formattedFeesUSD = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.feesUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  //watchlist
  const [savedPools, addSavedPool] = useSavedPools()

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={backgroundColor} />
      {poolData ? (
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
          <ResponsiveRow align="flex-end">
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
          </ResponsiveRow>
          <ContentLayout>
            <DarkGreyCard>
              <AutoColumn gap="lg">
                <GreyCard padding="16px">
                  <AutoColumn gap="md">
                    <TYPE.main>Total Tokens Locked</TYPE.main>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo address={poolData.token0.address} size={'20px'} />
                        <TYPE.label fontSize="14px" ml="8px">
                          {poolData.token0.symbol}
                        </TYPE.label>
                      </RowFixed>
                      <TYPE.label fontSize="14px">{formatAmount(poolData.tvlToken0)}</TYPE.label>
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo address={poolData.token1.address} size={'20px'} />
                        <TYPE.label fontSize="14px" ml="8px">
                          {poolData.token1.symbol}
                        </TYPE.label>
                      </RowFixed>
                      <TYPE.label fontSize="14px">{formatAmount(poolData.tvlToken1)}</TYPE.label>
                    </RowBetween>
                  </AutoColumn>
                </GreyCard>
                <AutoColumn gap="4px">
                  <TYPE.main fontWeight={400}>TVL</TYPE.main>
                  <TYPE.label fontSize="24px">{formatDollarAmount(poolData.tvlUSD)}</TYPE.label>
                  <Percent value={poolData.tvlUSDChange} />
                </AutoColumn>
                <AutoColumn gap="4px">
                  <TYPE.main fontWeight={400}>Volume 24h</TYPE.main>
                  <TYPE.label fontSize="24px">{formatDollarAmount(poolData.volumeUSD)}</TYPE.label>
                  <Percent value={poolData.volumeUSDChange} />
                </AutoColumn>
                <AutoColumn gap="4px">
                  <TYPE.main fontWeight={400}>24h Fees</TYPE.main>
                  <TYPE.label fontSize="24px">{formatDollarAmount(poolData.feesUSD)}</TYPE.label>
                </AutoColumn>
              </AutoColumn>
            </DarkGreyCard>
            <DarkGreyCard>
              <ToggleRow align="flex-start">
                <AutoColumn>
                  <TYPE.label fontSize="24px" height="30px">
                    <MonoSpace>
                      {latestValue
                        ? formatDollarAmount(latestValue)
                        : view === ChartView.VOL
                        ? formatDollarAmount(formattedVolumeData[formattedVolumeData.length - 1]?.value)
                        : view === ChartView.DENSITY
                        ? ''
                        : formatDollarAmount(formattedTvlData[formattedTvlData.length - 1]?.value)}{' '}
                    </MonoSpace>
                  </TYPE.label>
                  <TYPE.main height="20px" fontSize="12px">
                    {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : ''}
                  </TYPE.main>
                </AutoColumn>
                <ToggleWrapper width="240px">
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
                    onClick={() => (view === ChartView.TVL ? setView(ChartView.DENSITY) : setView(ChartView.TVL))}
                  >
                    TVL
                  </ToggleElementFree>
                  {activeNetwork === ArbitrumNetworkInfo ? null : (
                    <ToggleElementFree
                      isActive={view === ChartView.DENSITY}
                      fontSize="12px"
                      onClick={() => (view === ChartView.DENSITY ? setView(ChartView.VOL) : setView(ChartView.DENSITY))}
                    >
                      Liquidity
                    </ToggleElementFree>
                  )}
                  <ToggleElementFree
                    isActive={view === ChartView.FEES}
                    fontSize="12px"
                    onClick={() => (view === ChartView.FEES ? setView(ChartView.TVL) : setView(ChartView.FEES))}
                  >
                    Fees
                  </ToggleElementFree>
                </ToggleWrapper>
              </ToggleRow>
              {view === ChartView.TVL ? (
                <LineChart
                  data={formattedTvlData}
                  setLabel={setValueLabel}
                  color={backgroundColor}
                  minHeight={340}
                  setValue={setLatestValue}
                  value={latestValue}
                  label={valueLabel}
                />
              ) : view === ChartView.VOL ? (
                <BarChart
                  data={formattedVolumeData}
                  color={backgroundColor}
                  minHeight={340}
                  setValue={setLatestValue}
                  setLabel={setValueLabel}
                  value={latestValue}
                  label={valueLabel}
                />
              ) : view === ChartView.FEES ? (
                <BarChart
                  data={formattedFeesUSD}
                  color={backgroundColor}
                  minHeight={340}
                  setValue={setLatestValue}
                  setLabel={setValueLabel}
                  value={latestValue}
                  label={valueLabel}
                />
              ) : (
                // FIXME: use aggregated liquidity instead of just the default tier
                <DensityChart tierKey={`${poolId}#0`} />
              )}
            </DarkGreyCard>
          </ContentLayout>
          <TYPE.main fontSize="24px">All tiers</TYPE.main>
          <DarkGreyCard>{tierDatas ? <TierTable tierDatas={tierDatas} /> : <LocalLoader fill={false} />}</DarkGreyCard>
          <TYPE.main fontSize="24px">Transactions</TYPE.main>
          <DarkGreyCard>
            {transactions ? <TransactionTable transactions={transactions} /> : <LocalLoader fill={false} />}
          </DarkGreyCard>
        </AutoColumn>
      ) : (
        <Loader />
      )}
    </PageWrapper>
  )
}
