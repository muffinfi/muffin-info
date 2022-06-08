import { TierKey } from './reducer'

export const normalizeKey = (key: TierKey) => {
  if (typeof key === 'string') return key
  return `${key[0]}#${key[1]}`
}
