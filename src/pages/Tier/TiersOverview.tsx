import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import TierTable from 'components/tiers/TierTable'
import { PageWrapper } from 'pages/styled'
import React, { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAllTierData, useTierDatas } from 'state/tiers/hooks'
import { useSavedTiers } from 'state/user/hooks'
import { TYPE } from 'theme'
import { notEmpty } from 'utils'
// import TopPoolMovers from 'components/pools/TopPoolMovers'

export default function TiersOverview() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // get all the pool tier that exist
  const allData = useAllTierData()
  const datas = useMemo(() => {
    return Object.values(allData)
      .map((p) => p.data)
      .filter(notEmpty)
  }, [allData])

  const [saved] = useSavedTiers()
  const watchlists = useTierDatas(saved)

  return (
    <PageWrapper>
      <Helmet>
        <title>Tiers - Muffin Analytics</title>
      </Helmet>
      <AutoColumn gap="lg">
        <TYPE.main>Your Watchlist</TYPE.main>
        {watchlists.length > 0 ? (
          <TierTable tierDatas={watchlists} />
        ) : (
          <DarkGreyCard>
            <TYPE.main>Saved tiers will appear here</TYPE.main>
          </DarkGreyCard>
        )}
        {/* <HideSmall>
          <DarkGreyCard style={{ paddingTop: '12px' }}>
            <AutoColumn gap="md">
              <TYPE.mediumHeader fontSize="16px">Trending by 24H Volume</TYPE.mediumHeader>
              <TopPoolMovers />
            </AutoColumn>
          </DarkGreyCard>
        </HideSmall> */}
        <TYPE.main>All Tiers</TYPE.main>
        <TierTable tierDatas={datas} />
      </AutoColumn>
    </PageWrapper>
  )
}
