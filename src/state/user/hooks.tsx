import { Token } from '@uniswap/sdk-core'
import { useAppSelector } from 'hooks/useAppDispatch'
import { useCallback, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { TierKey } from 'state/tiers/reducer'
import { normalizeKey } from 'state/tiers/utils'
import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import {
  addSavedPool,
  addSavedTier,
  addSavedToken,
  addSerializedToken,
  removeSerializedToken,
  SerializedToken,
  toggleURLWarning,
  updateUserDarkMode,
} from './actions'

function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  }
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name
  )
}

export function useIsDarkMode(): boolean {
  const { userDarkMode, matchesDarkMode } = useSelector<
    AppState,
    { userDarkMode: boolean | null; matchesDarkMode: boolean }
  >(
    ({ user: { matchesDarkMode, userDarkMode } }) => ({
      userDarkMode,
      matchesDarkMode,
    }),
    shallowEqual
  )

  return userDarkMode === null ? matchesDarkMode : userDarkMode
}

export function useDarkModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const darkMode = true

  const toggleSetDarkMode = useCallback(() => {
    dispatch(updateUserDarkMode({ userDarkMode: !darkMode }))
  }, [darkMode, dispatch])

  return [darkMode, toggleSetDarkMode]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch]
  )
}

export function useSavedTokens(): [string[], (address: string) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const savedTokens = useSelector((state: AppState) => state.user.savedTokens)
  const updatedSavedTokens = useCallback(
    (address: string) => {
      dispatch(addSavedToken({ address }))
    },
    [dispatch]
  )
  return [savedTokens ?? [], updatedSavedTokens]
}

export function useSavedPools(): [string[], (poolId: string) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const savedPools = useSelector((state: AppState) => state.user.savedPools)
  const updateSavedPools = useCallback(
    (poolId: string) => {
      dispatch(addSavedPool({ poolId }))
    },
    [dispatch]
  )
  return [savedPools ?? [], updateSavedPools]
}

export function useSavedTiers(): [string[], (tierKey: TierKey) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const savedTiers = useSelector((state: AppState) => state.user.savedTiers)
  const updateSavedTiers = useCallback(
    (tierKey: TierKey) => {
      dispatch(addSavedTier({ key: normalizeKey(tierKey) }))
    },
    [dispatch]
  )
  return [savedTiers ?? [], updateSavedTiers]
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch]
  )
}

export function useUserAddedTokens(): Token[] {
  const { chainId } = useActiveWeb3React()
  const serializedTokensMap = useAppSelector(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap?.[chainId] ?? {}).map(deserializeToken)
  }, [serializedTokensMap, chainId])
}

export function useURLWarningVisible(): boolean {
  return useSelector((state: AppState) => state.user.URLWarningVisible)
}

export function useURLWarningToggle(): () => void {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(toggleURLWarning()), [dispatch])
}
