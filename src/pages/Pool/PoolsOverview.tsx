import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import PoolTable from 'components/pools/PoolTable'
import { PageWrapper } from 'pages/styled'
import React, { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { useAllPoolData, usePoolDatas } from 'state/pools/hooks'
import { useSavedPools } from 'state/user/hooks'
import { TYPE } from 'theme'
import { notEmpty } from 'utils'
// import TopPoolMovers from 'components/pools/TopPoolMovers'

export default function PoolsOverview() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // get all the pool datas that exist
  const allPoolData = useAllPoolData()
  const poolDatas = useMemo(() => {
    return Object.values(allPoolData)
      .map((p) => p.data)
      .filter(notEmpty)
  }, [allPoolData])

  const [savedPools] = useSavedPools()
  const watchlistPools = usePoolDatas(savedPools)

  return (
    <PageWrapper>
      <Helmet>
        <title>Pools - Muffin Analytics</title>
      </Helmet>
      <AutoColumn gap="lg">
        <TYPE.main>Your Watchlist</TYPE.main>
        {watchlistPools.length > 0 ? (
          <PoolTable poolDatas={watchlistPools} />
        ) : (
          <DarkGreyCard>
            <TYPE.main>Saved pools will appear here</TYPE.main>
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
        <TYPE.main>All Pools</TYPE.main>
        <PoolTable poolDatas={poolDatas} />
      </AutoColumn>
    </PageWrapper>
  )
}
