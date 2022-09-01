import { createAction } from '@reduxjs/toolkit'
import { SupportedNetwork } from 'constants/networks'
import { Transaction } from 'types'
import type { TierTickData } from '../../data/tiers/tickData'
import type { TierChartEntry, TierData, TierKey } from './reducer'

// protocol wide info
export const updateData = createAction<{ tiers: TierData[]; networkId: SupportedNetwork }>('tiers/updateData')

// add pool ids to byAddress
export const addKeys = createAction<{ keys: TierKey[]; networkId: SupportedNetwork }>('tiers/addKeys')

export const updateChartData = createAction<{
  key: TierKey
  chartData: TierChartEntry[]
  networkId: SupportedNetwork
}>('tiers/updateChartData')

export const updateTransactions = createAction<{
  key: TierKey
  transactions: Transaction[]
  networkId: SupportedNetwork
}>('tiers/updateTransactions')

export const updateTickData = createAction<{
  key: TierKey
  tickData: TierTickData | undefined
  networkId: SupportedNetwork
}>('tiers/updateTickData')
