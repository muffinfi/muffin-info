import { createReducer } from '@reduxjs/toolkit'
import { SupportedNetwork } from 'constants/networks'
import { TierTickData } from 'data/tiers/tickData'
import { Transaction } from 'types'
import { currentTimestamp } from 'utils'
import { addKeys, updateChartData, updateData, updateTickData, updateTransactions } from './actions'
import { normalizeKey } from './utils'

export interface TierData {
  // tier data
  tierId: number
  feeTier: number
  sqrtGamma: number

  // prices
  token0Price: number
  token1Price: number

  // for tick math
  liquidity: number
  sqrtPrice: number
  tick: number
  nextTickAbove: number
  nextTickBelow: number

  poolId: string

  pool: {
    tickSpacing: number

    token0: {
      name: string
      symbol: string
      address: string
      decimals: number
      derivedETH: number
    }

    token1: {
      name: string
      symbol: string
      address: string
      decimals: number
      derivedETH: number
    }
  }

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number

  // fees
  feesUSD: number
  feesUSDChange: number
  feesUSDWeek: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  // token amounts
  tvlToken0: number
  tvlToken1: number
}

export type TierChartEntry = {
  date: number
  volumeUSD: number
  totalValueLockedUSD: number
  feesUSD: number
  open: number
  close: number
  high: number
  low: number
  token0Price: number
  token1Price: number
}

export type TierKey = string | [string, number]

export interface TiersState {
  // analytics data from
  byKey: {
    [networkId: string]: {
      // tierKey is in `${pool.id}#${tier.id}` format
      [tierKey: string]: {
        data: TierData | undefined
        chartData: TierChartEntry[] | undefined
        transactions: Transaction[] | undefined
        lastUpdated: number | undefined
        tickData: TierTickData | undefined
      }
    }
  }
}

export const initialState: TiersState = {
  byKey: {
    [SupportedNetwork.ETHEREUM]: {},
    [SupportedNetwork.ARBITRUM]: {},
    [SupportedNetwork.OPTIMISM]: {},
    [SupportedNetwork.POLYGON]: {},
    [SupportedNetwork.RINKEBY]: {},
  },
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateData, (state, { payload: { tiers, networkId } }) => {
      tiers.map((tier) => {
        const key = normalizeKey([tier.poolId, tier.tierId])
        state.byKey[networkId][key] = {
          ...state.byKey[networkId][key],
          data: tier,
          lastUpdated: currentTimestamp(),
        }
      })
    })
    // add poolId and tierId to byKey keys if not included yet
    .addCase(addKeys, (state, { payload: { keys, networkId } }) => {
      keys.map((key) => {
        const normalized = normalizeKey(key)
        if (!state.byKey[networkId][normalized]) {
          state.byKey[networkId][normalized] = {
            data: undefined,
            chartData: undefined,
            transactions: undefined,
            lastUpdated: undefined,
            tickData: undefined,
          }
        }
      })
    })
    .addCase(updateChartData, (state, { payload: { key, chartData, networkId } }) => {
      state.byKey[networkId][normalizeKey(key)] = {
        ...state.byKey[networkId][normalizeKey(key)],
        chartData,
      }
    })
    .addCase(updateTransactions, (state, { payload: { key, transactions, networkId } }) => {
      state.byKey[networkId][normalizeKey(key)] = {
        ...state.byKey[networkId][normalizeKey(key)],
        transactions,
      }
    })
    .addCase(updateTickData, (state, { payload: { key, tickData, networkId } }) => {
      state.byKey[networkId][normalizeKey(key)] = {
        ...state.byKey[networkId][normalizeKey(key)],
        tickData,
      }
    })
)
