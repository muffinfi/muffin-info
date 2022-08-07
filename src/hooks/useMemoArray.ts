import { useMemo, useRef } from 'react'

/**
 * Returns true if the two given arrays have the same items
 */
const isSameArrayItems = <T>(xs: T[], ys: T[]): boolean => {
  return xs.length === ys.length && xs.every((x, i) => x === ys[i])
}

export function useMemoArray<T>(xs: T[]): T[] {
  const ref = useRef(xs)

  return useMemo(() => {
    if (!isSameArrayItems(ref.current, xs)) {
      ref.current = xs
    }
    return ref.current
  }, [xs])
}

export function useMemoArrayOptional<T>(xs: T[] | undefined): T[] | undefined {
  const ref = useRef(xs)

  return useMemo(() => {
    const prev = ref.current
    if (prev && xs) {
      if (isSameArrayItems(prev, xs)) return prev
    } else {
      if (prev == null && xs == null) return prev
    }
    return (ref.current = xs)
  }, [xs])
}
