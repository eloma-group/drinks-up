import { useCallback, useState } from 'react'

/** Page filter state that survives navigation (the mockup kept these as globals: OF, PF, CF, IF, RF, RANGE, RR). */
const mem = new Map<string, unknown>()

export function usePersist<T>(key: string, init: T): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(() => (mem.has(key) ? (mem.get(key) as T) : init))
  const set = useCallback((n: T | ((p: T) => T)) => {
    setV(prev => {
      const next = typeof n === 'function' ? (n as (p: T) => T)(prev) : n
      mem.set(key, next)
      return next
    })
  }, [key])
  return [v, set]
}

export const setPersist = <T,>(key: string, fn: (p: T | undefined) => T) => { mem.set(key, fn(mem.get(key) as T | undefined)) }
export const getPersist = <T,>(key: string) => mem.get(key) as T | undefined
