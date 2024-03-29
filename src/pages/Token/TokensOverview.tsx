import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import TokenTable from 'components/tokens/TokenTable'
import TopTokenMovers from 'components/tokens/TopTokenMovers'
import { PageWrapper } from 'pages/styled'
import React, { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAllTokenData, useTokenDatas } from 'state/tokens/hooks'
import { useSavedTokens } from 'state/user/hooks'
import { HideSmall, TYPE } from 'theme'
import { notEmpty } from 'utils'

export default function TokensOverview() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const allTokens = useAllTokenData()

  const formattedTokens = useMemo(() => {
    return Object.values(allTokens)
      .map((t) => t.data)
      .filter(notEmpty)
  }, [allTokens])

  const [savedTokens] = useSavedTokens()
  const watchListTokens = useTokenDatas(savedTokens)

  return (
    <PageWrapper>
      <Helmet>
        <title>Tokens - Muffin Analytics</title>
      </Helmet>
      <AutoColumn gap="lg">
        <TYPE.main>Your Watchlist</TYPE.main>
        {savedTokens.length > 0 ? (
          <TokenTable tokenDatas={watchListTokens} />
        ) : (
          <DarkGreyCard>
            <TYPE.main>Saved tokens will appear here</TYPE.main>
          </DarkGreyCard>
        )}
        <HideSmall>
          <DarkGreyCard style={{ paddingTop: '12px' }}>
            <AutoColumn gap="md">
              <TYPE.mediumHeader fontSize="16px">Top Movers</TYPE.mediumHeader>
              <TopTokenMovers />
            </AutoColumn>
          </DarkGreyCard>
        </HideSmall>
        <TYPE.main>All Tokens</TYPE.main>
        <TokenTable tokenDatas={formattedTokens} />
      </AutoColumn>
    </PageWrapper>
  )
}
