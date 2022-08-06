import { DarkGreyCard } from 'components/Card'
import ProtocolTvlChart from './ProtocolTvlChart'
import ProtocolVolumeChart from './ProtocolVolumeChart'
import { AutoColumn } from 'components/Column'
import Percent from 'components/Percent'
import PoolTable from 'components/pools/PoolTable'
import { ResponsiveRow, RowBetween, RowFixed } from 'components/Row'
import TierTable from 'components/tiers/TierTable'
import TokenTable from 'components/tokens/TokenTable'
import useTheme from 'hooks/useTheme'
import { PageWrapper, ThemedBackgroundGlobal } from 'pages/styled'
import React, { useEffect, useMemo, useState } from 'react'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useAllPoolData } from 'state/pools/hooks'
import { useProtocolData, useProtocolTransactions } from 'state/protocol/hooks'
import { useAllTierData } from 'state/tiers/hooks'
import { useAllTokenData } from 'state/tokens/hooks'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { notEmpty } from 'utils'
import { formatDollarAmount } from 'utils/numbers'
import TransactionsTable from '../../components/TransactionsTable'
import { HideMedium, HideSmall, StyledInternalLink } from '../../theme/components'

const ChartWrapper = styled.div`
  width: 49%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

function filterExistData<T>(allData: Record<string, { data: T | undefined }>) {
  return Object.values(allData)
    .map((data) => data.data)
    .filter(notEmpty)
    .slice(0, 50)
}

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const theme = useTheme()

  const [activeNetwork] = useActiveNetworkVersion()

  const [protocolData] = useProtocolData()
  const [transactions] = useProtocolTransactions()

  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [liquidityHover, setLiquidityHover] = useState<number | undefined>()

  useEffect(() => {
    setLiquidityHover(undefined)
    setVolumeHover(undefined)
  }, [activeNetwork])

  // get all the token datas that exist
  const allTokens = useAllTokenData()
  const tokensData = useMemo(() => filterExistData(allTokens), [allTokens])

  // get all the pool datas that exist
  const allPoolData = useAllPoolData()
  const poolDatas = useMemo(() => filterExistData(allPoolData), [allPoolData])

  // get all the tier datas that exist
  const allTierData = useAllTierData()
  const tierDatas = useMemo(() => filterExistData(allTierData), [allTierData])

  // if hover value undefined, reset to current day value
  useEffect(() => {
    if (volumeHover === undefined && protocolData) {
      setVolumeHover(protocolData.volumeUSD)
    }
  }, [protocolData, volumeHover])
  useEffect(() => {
    if (liquidityHover === undefined && protocolData) {
      setLiquidityHover(protocolData.tvlUSD)
    }
  }, [liquidityHover, protocolData])

  return (
    <PageWrapper>
      <ThemedBackgroundGlobal backgroundColor={activeNetwork.bgColor} />
      <AutoColumn gap="16px">
        <TYPE.main>Muffin Overview</TYPE.main>
        <ResponsiveRow>
          <ChartWrapper>
            <ProtocolTvlChart height={220} color={activeNetwork.primaryColor} />
          </ChartWrapper>
          <ChartWrapper>
            <ProtocolVolumeChart height={220} color={theme.blue1} />
          </ChartWrapper>
        </ResponsiveRow>
        <HideSmall>
          <DarkGreyCard>
            <RowBetween>
              <RowFixed>
                <RowFixed mr="20px">
                  <TYPE.main mr="4px">Volume 24H: </TYPE.main>
                  <TYPE.label mr="4px">{formatDollarAmount(protocolData?.volumeUSD)}</TYPE.label>
                  <Percent value={protocolData?.volumeUSDChange} wrap={true} />
                </RowFixed>
                <RowFixed mr="20px">
                  <TYPE.main mr="4px">Fees 24H: </TYPE.main>
                  <TYPE.label mr="4px">{formatDollarAmount(protocolData?.feesUSD)}</TYPE.label>
                  <Percent value={protocolData?.feeChange} wrap={true} />
                </RowFixed>
                <HideMedium>
                  <RowFixed mr="20px">
                    <TYPE.main mr="4px">TVL: </TYPE.main>
                    <TYPE.label mr="4px">{formatDollarAmount(protocolData?.tvlUSD)}</TYPE.label>
                    <TYPE.main></TYPE.main>
                    <Percent value={protocolData?.tvlUSDChange} wrap={true} />
                  </RowFixed>
                </HideMedium>
              </RowFixed>
            </RowBetween>
          </DarkGreyCard>
        </HideSmall>
        <RowBetween>
          <TYPE.main>Top Tokens</TYPE.main>
          <StyledInternalLink to="tokens">Explore</StyledInternalLink>
        </RowBetween>
        <TokenTable tokenDatas={tokensData} />
        <RowBetween>
          <TYPE.main>Top Pools</TYPE.main>
          <StyledInternalLink to="pools">Explore</StyledInternalLink>
        </RowBetween>
        <PoolTable poolDatas={poolDatas} />
        <RowBetween>
          <TYPE.main>Top Tiers</TYPE.main>
          <StyledInternalLink to="tiers">Explore</StyledInternalLink>
        </RowBetween>
        <TierTable tierDatas={tierDatas} />
        <RowBetween>
          <TYPE.main>Transactions</TYPE.main>
        </RowBetween>
        {transactions ? <TransactionsTable transactions={transactions} color={activeNetwork.primaryColor} /> : null}
      </AutoColumn>
    </PageWrapper>
  )
}
