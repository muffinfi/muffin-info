import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

export function RedirectToTier0(props: RouteComponentProps<{ poolId: string }>) {
  const {
    match: {
      params: { poolId },
    },
  } = props

  return <Redirect to={`/pools/${poolId}/tiers/0`} />
}
