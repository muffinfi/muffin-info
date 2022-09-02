import { createReducer } from '@reduxjs/toolkit'
import { SupportedNetwork } from 'constants/networks'
import { TierTickData } from 'data/tiers/tickData'
import { SerializedToken } from 'state/user/actions'
import { Transaction } from 'types'
import { currentTimestamp } from './../../utils/index'
import { addPoolKeys, updatePoolChartData, updatePoolData, updatePoolTransactions, updateTickData } from './actions'

export interface Pool {
  poolId: string
  token0: SerializedToken
  token1: SerializedToken
}

export interface PoolData {
  // basic token info
  poolId: string

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

  tickSpacing: number

  tiers: {
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
  }[]
}

export type PoolChartEntry = {
  date: number
  volumeUSD: number
  totalValueLockedUSD: number
  feesUSD: number
}

export interface PoolsState {
  // analytics data from
  byAddress: {
    [networkId: string]: {
      [address: string]: {
        data: PoolData | undefined
        chartData: PoolChartEntry[] | undefined
        transactions: Transaction[] | undefined
        lastUpdated: number | undefined
        tickData: TierTickData | undefined
      }
    }
  }
}

export const initialState: PoolsState = {
  byAddress: {
    [SupportedNetwork.ETHEREUM]: {},
    [SupportedNetwork.ARBITRUM]: {},
    [SupportedNetwork.OPTIMISM]: {},
    [SupportedNetwork.POLYGON]: {},
    [SupportedNetwork.RINKEBY]: {},
    [SupportedNetwork.GOERLI]: {},
  },
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updatePoolData, (state, { payload: { pools, networkId } }) => {
      pools.map(
        (poolData) =>
          (state.byAddress[networkId][poolData.poolId] = {
            ...state.byAddress[networkId][poolData.poolId],
            data: poolData,
            lastUpdated: currentTimestamp(),
          })
      )
    })
    // add address to byAddress keys if not included yet
    .addCase(addPoolKeys, (state, { payload: { poolAddresses, networkId } }) => {
      poolAddresses.map((address) => {
        if (!state.byAddress[networkId][address]) {
          state.byAddress[networkId][address] = {
            data: undefined,
            chartData: undefined,
            transactions: undefined,
            lastUpdated: undefined,
            tickData: undefined,
          }
        }
      })
    })
    .addCase(updatePoolChartData, (state, { payload: { poolAddress, chartData, networkId } }) => {
      state.byAddress[networkId][poolAddress] = { ...state.byAddress[networkId][poolAddress], chartData: chartData }
    })
    .addCase(updatePoolTransactions, (state, { payload: { poolAddress, transactions, networkId } }) => {
      state.byAddress[networkId][poolAddress] = { ...state.byAddress[networkId][poolAddress], transactions }
    })
    .addCase(updateTickData, (state, { payload: { poolAddress, tickData, networkId } }) => {
      state.byAddress[networkId][poolAddress] = { ...state.byAddress[networkId][poolAddress], tickData }
    })
)
