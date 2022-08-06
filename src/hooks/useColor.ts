import { Token } from '@uniswap/sdk-core'
import Vibrant from 'node-vibrant'
import { shade } from 'polished'
import { useLayoutEffect, useMemo, useState } from 'react'
import { isAddress } from 'utils'
import uriToHttp from 'utils/uriToHttp'
import { hex } from 'wcag-contrast'
import useTheme from './useTheme'

async function getColorFromToken(token: Token): Promise<string | null> {
  const path = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token.address}/logo.png`

  return Vibrant.from(path)
    .getPalette()
    .then((palette) => {
      if (palette?.Vibrant) {
        let detectedHex = palette.Vibrant.hex
        let AAscore = hex(detectedHex, '#FFF')
        while (AAscore < 3) {
          detectedHex = shade(0.005, detectedHex)
          AAscore = hex(detectedHex, '#FFF')
        }
        return detectedHex
      }
      return null
    })
    .catch(() => null)
}

async function getColorFromUriPath(uri: string): Promise<string | null> {
  const formattedPath = uriToHttp(uri)[0]

  return Vibrant.from(formattedPath)
    .getPalette()
    .then((palette) => {
      if (palette?.Vibrant) {
        return palette.Vibrant.hex
      }
      return null
    })
    .catch(() => null)
}

export function useColor(address?: string, defaultColor?: string) {
  const theme = useTheme()
  const defaultColor_ = defaultColor ?? theme.secondary1

  const [color, setColor] = useState(defaultColor_)

  const formattedAddress = isAddress(address)

  const token = useMemo(() => {
    return formattedAddress ? new Token(1, formattedAddress, 0) : undefined
  }, [formattedAddress])

  useLayoutEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token).then((tokenColor) => {
        if (!stale && tokenColor !== null) {
          setColor(tokenColor)
        }
      })
    }

    return () => {
      stale = true
      setColor(defaultColor_)
    }
  }, [token, defaultColor_])

  return color
}

export function useListColor(listImageUri?: string) {
  const theme = useTheme()
  const [color, setColor] = useState(theme.secondary1)

  useLayoutEffect(() => {
    let stale = false

    if (listImageUri) {
      getColorFromUriPath(listImageUri).then((color) => {
        if (!stale && color !== null) {
          setColor(color)
        }
      })
    }

    return () => {
      stale = true
      setColor(theme.secondary1)
    }
  }, [listImageUri, theme.secondary1])

  return color
}
