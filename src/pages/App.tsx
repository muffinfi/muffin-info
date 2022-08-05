import { DarkGreyCard } from 'components/Card'
// import TopBar from 'components/Header/TopBar'
import { LocalLoader } from 'components/Loader'
import { EthereumNetworkInfo, OptimismNetworkInfo, SUPPORTED_NETWORK_VERSIONS } from 'constants/networks'
import React, { Suspense, useEffect, useState } from 'react'
import { Route, Switch, useLocation } from 'react-router-dom'
import { useActiveNetworkVersion, useSubgraphStatus } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, TYPE } from 'theme'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import Header from '../components/Header'
import URLWarning from '../components/Header/URLWarning'
import Popups from '../components/Popups'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import Home from './Home'
import PoolPage from './Pool/PoolPage'
import PoolPageOriginal from './Pool/PoolPage_original'
import PoolsOverview from './Pool/PoolsOverview'
import { RedirectToTier0 } from './Tier/redirects'
import TierPage from './Tier/TierPage'
import TierPageOriginal from './Tier/TierPage_original'
import TiersOverview from './Tier/TiersOverview'
import { RedirectInvalidToken } from './Token/redirects'
import TokensOverview from './Token/TokensOverview'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  /* overflow-x: hidden; */
  min-height: 100vh;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  width: 100%;
  position: fixed;
  justify-content: space-between;
  z-index: 2;
`

const BodyWrapper = styled.div<{ warningActive?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 40px;
  /* margin-top: ${({ warningActive }) => (warningActive ? '140px' : '100px')}; */
  margin-top: ${({ warningActive }) => (warningActive ? '100px' : '60px')};
  align-items: center;
  flex: 1;
  /* overflow-y: auto; */
  /* overflow-x: hidden; */
  z-index: 1;

  > * {
    max-width: 1200px;
  }

  @media (max-width: 1080px) {
    padding-top: 2rem;
    margin-top: 140px;
  }
`

const Marginer = styled.div`
  margin-top: 5rem;
`

// const Hide1080 = styled.div`
//   @media (max-width: 1080px) {
//     display: none;
//   }
// `

const WarningWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

const WarningBanner = styled.div`
  background-color: ${({ theme }) => theme.bg3};
  padding: 1rem;
  color: white;
  font-size: 14px;
  width: 100%;
  text-align: center;
  font-weight: 500;
`

const BLOCK_DIFFERENCE_THRESHOLD = 30

export default function App() {
  // pretend load buffer
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setTimeout(() => setLoading(false), 1300)
  }, [])

  // update network based on route
  // TEMP - find better way to do this
  const location = useLocation()
  const [activeNetwork, setActiveNetwork] = useActiveNetworkVersion()
  useEffect(() => {
    if (location.pathname === '/') {
      setActiveNetwork(EthereumNetworkInfo)
    } else {
      SUPPORTED_NETWORK_VERSIONS.map((n) => {
        if (location.pathname.includes(n.route.toLocaleLowerCase())) {
          setActiveNetwork(n)
        }
      })
    }
  }, [location.pathname, setActiveNetwork])

  // subgraph health
  const [subgraphStatus] = useSubgraphStatus()

  const showNotSyncedWarning =
    subgraphStatus.headBlock && subgraphStatus.syncedBlock && activeNetwork === OptimismNetworkInfo
      ? subgraphStatus.headBlock - subgraphStatus.syncedBlock > BLOCK_DIFFERENCE_THRESHOLD
      : false

  return (
    <Suspense fallback={null}>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      {loading ? (
        <LocalLoader fill={true} />
      ) : (
        <AppWrapper>
          <URLWarning />
          <HeaderWrapper>
            {showNotSyncedWarning && (
              <WarningWrapper>
                <WarningBanner>
                  {`Warning:
                  Data has only synced to  block ${subgraphStatus.syncedBlock} (out of ${subgraphStatus.headBlock}). Please check back soon.`}
                </WarningBanner>
              </WarningWrapper>
            )}
            {/* <Hide1080>
              <TopBar />
            </Hide1080> */}
            <Header />
          </HeaderWrapper>
          {subgraphStatus.available === false ? (
            <AppWrapper>
              <BodyWrapper>
                <DarkGreyCard style={{ maxWidth: '340px' }}>
                  <TYPE.label>
                    The Graph hosted network which provides data for this site is temporarily experiencing issues. Check
                    current status{' '}
                    <ExternalLink href="https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3">
                      here.
                    </ExternalLink>
                  </TYPE.label>
                </DarkGreyCard>
              </BodyWrapper>
            </AppWrapper>
          ) : (
            <BodyWrapper warningActive={showNotSyncedWarning}>
              <Popups />
              <Switch>
                {/* TODO: Old pages pending to delete  */}
                <Route exact strict path="/:networkID?/pools/:poolId/tiers-0/:tierId" component={TierPageOriginal} />
                <Route exact strict path="/:networkID?/pools-0/:poolId" component={PoolPageOriginal} />

                <Route exact strict path="/:networkID?/pools/:poolId/tiers/:tierId" component={TierPage} />
                <Route exact strict path="/:networkID?/pools/:poolId/tiers" component={RedirectToTier0} />
                <Route exact strict path="/:networkID?/tiers" component={TiersOverview} />
                <Route exact strict path="/:networkID?/pools/:poolId" component={PoolPage} />
                <Route exact strict path="/:networkID?/pools" component={PoolsOverview} />
                <Route exact strict path="/:networkID?/tokens/:address" component={RedirectInvalidToken} />
                <Route exact strict path="/:networkID?/tokens" component={TokensOverview} />
                <Route exact path="/:networkID?" component={Home} />
              </Switch>
              <Marginer />
            </BodyWrapper>
          )}
        </AppWrapper>
      )}
    </Suspense>
  )
}
