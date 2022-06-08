export default function getValue<V>(object: any, keyPath: string | string[], defaultValue: V | undefined = undefined) {
  if (object == null) return defaultValue
  const keys = Array.isArray(keyPath) ? keyPath : keyPath.split('.')
  let intermediate = object
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]
    intermediate = intermediate[key]
    if (intermediate == null) return defaultValue
  }
  return intermediate ?? defaultValue
}
