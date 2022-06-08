import { Pool, TickMath, Tier, toD8 } from '@muffinfi/muffin-v1-sdk'
import { Token } from '@uniswap/sdk-core'
import Loader from 'components/Loader'
import { fetchTicksSurroundingPrice, TickProcessed } from 'data/tiers/tickData'
import useTheme from 'hooks/useTheme'
import JSBI from 'jsbi'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useClients } from 'state/application/hooks'
import { usePoolDatas, usePoolTickData } from 'state/pools/hooks'
import styled from 'styled-components'
import { isAddress } from 'utils'
import { CurrentPriceLabel } from './CurrentPriceLabel-copy'
import CustomToolTip from './CustomToolTip-copy'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
`

const ControlsWrapper = styled.div`
  position: absolute;
  right: 40px;
  bottom: 100px;
  padding: 4px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 6px;
`

const ActionButton = styled.div<{ disabled?: boolean }>`
  width: 32x;
  border-radius: 50%;
  background-color: black;
  padding: 4px 8px;
  display: flex;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
  align-items: center;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 0.9)};
  background-color: ${({ theme, disabled }) => (disabled ? theme.bg3 : theme.bg2)};
  user-select: none;

  :hover {
    cursor: pointer;
    opacity: 0.4;
  }
`

interface DensityChartProps {
  poolId: string
  tierId: number
}

export interface ChartEntry {
  index: number
  isCurrent: boolean
  activeLiquidity: number
  price0: number
  price1: number
  tickIdx: number
  activeLiquidityD8: JSBI
}

interface ZoomStateProps {
  left: number
  right: number
  refAreaLeft: string | number
  refAreaRight: string | number
}

const INITIAL_TICKS_TO_FETCH = 200
const ZOOM_INTERVAL = 20

const initialState = {
  left: 0,
  right: INITIAL_TICKS_TO_FETCH * 2 + 1,
  refAreaLeft: '',
  refAreaRight: '',
}

const CustomBar = ({
  x,
  y,
  width,
  height,
  fill,
}: {
  x: number
  y: number
  width: number
  height: number
  fill: string
}) => (
  <g>
    <rect x={x} y={y} fill={fill} width={width} height={height} rx="2" />
  </g>
)

export default function DensityChart({ poolId, tierId }: DensityChartProps) {
  const theme = useTheme()
  const { dataClient } = useClients()

  // poolData
  const [poolData] = usePoolDatas([poolId])
  const formattedAddress0 = isAddress(poolData.token0.address)
  const formattedAddress1 = isAddress(poolData.token1.address)

  // parsed tokens
  const token0 = useMemo(() => {
    return poolData && formattedAddress0 && formattedAddress1
      ? new Token(1, formattedAddress0, poolData.token0.decimals, poolData.token0.symbol, poolData.token0.name)
      : undefined
  }, [formattedAddress0, formattedAddress1, poolData])
  const token1 = useMemo(() => {
    return poolData && formattedAddress1 && formattedAddress1
      ? new Token(1, formattedAddress1, poolData.token1.decimals, poolData.token1.symbol, poolData.token1.name)
      : undefined
  }, [formattedAddress1, poolData])

  // tick data tracking
  const [poolTickData, updatePoolTickData] = usePoolTickData(poolId)
  const [ticksToFetch, setTicksToFetch] = useState(INITIAL_TICKS_TO_FETCH)
  const amountTicks = ticksToFetch * 2 + 1

  const [loading, setLoading] = useState(false)
  const [zoomState, setZoomState] = useState<ZoomStateProps>(initialState)

  const pool = useMemo(
    () =>
      token0 && token1 && poolData
        ? new Pool(
            token0,
            token1,
            poolData.tickSpacing,
            poolData.tiers.map(
              (tier) =>
                new Tier(
                  token0,
                  token1,
                  tier.liquidity,
                  TickMath.tickToSqrtPriceX72(tier.tick),
                  tier.sqrtGamma,
                  tier.nextTickBelow,
                  tier.nextTickAbove
                )
            )
          )
        : undefined,
    [poolData, token0, token1]
  )

  useEffect(() => {
    async function fetch() {
      const { data } = await fetchTicksSurroundingPrice([poolId, tierId], dataClient, ticksToFetch)
      if (data) {
        updatePoolTickData(poolId, data)
      }
    }
    if (!poolTickData || (poolTickData && poolTickData.ticksProcessed.length < amountTicks)) {
      fetch()
    }
  }, [poolId, tierId, poolTickData, updatePoolTickData, ticksToFetch, amountTicks, dataClient])

  const [formattedData, setFormattedData] = useState<ChartEntry[] | undefined>()
  useEffect(() => {
    async function formatData() {
      if (poolTickData && pool) {
        const newData = await Promise.all(
          poolTickData.ticksProcessed.map(async (t: TickProcessed, i) => {
            const active = t.tickIdx === poolTickData.activeTickIdx

            return {
              index: i,
              tickIdx: t.tickIdx,
              isCurrent: active,
              activeLiquidityD8: toD8(t.liquidityActive),
              activeLiquidity: parseFloat(t.liquidityActive.toString()),
              price0: parseFloat(t.price0),
              price1: parseFloat(t.price1),
            }
          })
        )

        if (newData) {
          if (loading) {
            setLoading(false)
          }
          setFormattedData(newData)
        }
        return
      } else {
        return []
      }
    }
    if (!formattedData) {
      formatData()
    }
  }, [formattedData, loading, pool, poolData.tickSpacing, poolTickData, tierId, token0, token1])

  const atZoomMax = zoomState.left + ZOOM_INTERVAL >= zoomState.right - ZOOM_INTERVAL - 1
  const atZoomMin = zoomState.left - ZOOM_INTERVAL < 0

  const handleZoomIn = useCallback(() => {
    !atZoomMax &&
      setZoomState({
        ...zoomState,
        left: zoomState.left + ZOOM_INTERVAL,
        right: zoomState.right - ZOOM_INTERVAL,
      })
  }, [zoomState, atZoomMax])

  const handleZoomOut = useCallback(() => {
    if (atZoomMin) {
      setLoading(true)
      setTicksToFetch(ticksToFetch + ZOOM_INTERVAL)
      setFormattedData(undefined)
      setZoomState({
        ...zoomState,
        left: 0,
        right: amountTicks,
      })
    } else {
      setZoomState({
        ...zoomState,
        left: zoomState.left - ZOOM_INTERVAL,
        right: zoomState.right + ZOOM_INTERVAL,
      })
    }
  }, [amountTicks, atZoomMin, ticksToFetch, zoomState])

  const zoomedData = useMemo(() => {
    if (formattedData) {
      return formattedData.slice(zoomState.left, zoomState.right)
    }
    return undefined
  }, [formattedData, zoomState.left, zoomState.right])

  // reset data on address change
  useEffect(() => {
    setFormattedData(undefined)
  }, [poolId])

  if (!poolTickData) {
    return <Loader />
  }

  return (
    <Wrapper>
      {!loading ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            width={500}
            height={300}
            data={zoomedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <Tooltip
              content={(props) => (
                <CustomToolTip chartProps={props} pool={pool} currentTickIdx={poolTickData.activeTickIdx} />
              )}
            />
            <XAxis reversed={true} tick={false} />
            <Bar
              dataKey="activeLiquidity"
              fill="#2172E5"
              isAnimationActive={false}
              shape={(props) => {
                // eslint-disable-next-line react/prop-types
                return <CustomBar height={props.height} width={props.width} x={props.x} y={props.y} fill={props.fill} />
              }}
            >
              {zoomedData?.map((entry, index) => {
                return <Cell key={`cell-${index}`} fill={entry.isCurrent ? theme.pink1 : theme.blue1} />
              })}
              <LabelList
                dataKey="activeLiquidity"
                position="inside"
                content={(props) => <CurrentPriceLabel chartProps={props} poolData={poolData} data={zoomedData} />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Loader />
      )}
      <ControlsWrapper>
        <ActionButton disabled={false} onClick={handleZoomOut}>
          -
        </ActionButton>
        <ActionButton disabled={atZoomMax} onClick={handleZoomIn}>
          +
        </ActionButton>
      </ControlsWrapper>
    </Wrapper>
  )
}
