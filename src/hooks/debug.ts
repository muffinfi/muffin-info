import { useEffect, useRef } from 'react'

export function useIsChanging(value: any, name: string) {
  const ref = useRef<any>()

  useEffect(() => {
    console.log(`[${name}] changed:`, ref.current, value)
    ref.current = value
  }, [value, name])
}

export function useCountRedraw(note?: string) {
  const ref = useRef(0)

  useEffect(() => {
    ref.current += 1
    console.log(`[${note ? `${note} ` : ''}redraw]`, ref.current)
  })
}
