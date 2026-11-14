import '@tanstack/react-start/server-only'

import { env } from 'cloudflare:workers'
import { z } from 'zod'

const retryDelay = 60_000
const refreshTimeout = 10_000
const maxLocalEntries = 256

interface CacheEntry {
  value: unknown
  refreshAfter: number
}

const localEntries = new Map<string, CacheEntry>()
const refreshLeases = new Map<string, number>()

function remember(key: string, entry: CacheEntry) {
  if (!localEntries.has(key) && localEntries.size >= maxLocalEntries) {
    const oldest = localEntries.keys().next()
    if (!oldest.done) localEntries.delete(oldest.value)
  }
  localEntries.set(key, entry)
}

export async function cachedPublicData<T>({
  name,
  ttl,
  schema,
  load,
  fallback,
}: {
  name: string
  ttl: number
  schema: z.ZodType<T>
  load: () => Promise<T>
  fallback: T
}): Promise<T> {
  const key = `public-data:v1:${name}`
  const binding = env.PUBLIC_DATA_CACHE
  const entrySchema = z.object({ value: schema, refreshAfter: z.number() })
  const readEntry = (input: unknown) => {
    const result = entrySchema.safeParse(input)
    return result.success ? result.data : undefined
  }
  const local = () => readEntry(localEntries.get(key))
  const hit = local()
  if (hit && hit.refreshAfter > Date.now()) return hit.value

  let stored
  try {
    stored = readEntry(await binding?.get(key, 'json'))
  } catch {}

  const latest = local()
  const stale = stored && (!latest || stored.refreshAfter > latest.refreshAfter) ? stored : latest
  if (stale && stale.refreshAfter > Date.now()) {
    remember(key, stale)
    return stale.value
  }

  const running = refreshLeases.get(key)
  if (running && running > Date.now()) {
    if (stale) return stale.value
    // Worker requests cannot await another request's I/O, so wait for plain data to be published.
    while (refreshLeases.get(key) === running && Date.now() < running) {
      await new Promise((done) => setTimeout(done, 50))
      const cached = local()
      if (cached) return cached.value
    }
    return local()?.value ?? fallback
  }

  const lease = Date.now() + refreshTimeout
  for (const [name, deadline] of refreshLeases) {
    if (deadline <= Date.now()) refreshLeases.delete(name)
  }
  refreshLeases.set(key, lease)

  try {
    const value = await load()
    const entry = { value, refreshAfter: Date.now() + ttl }
    if (refreshLeases.get(key) === lease) {
      remember(key, entry)
      await binding?.put(key, JSON.stringify(entry)).catch(() => undefined)
    }
    return value
  } catch {
    const entry = { value: stale ? stale.value : fallback, refreshAfter: Date.now() + retryDelay }
    if (refreshLeases.get(key) === lease) remember(key, entry)
    return entry.value
  } finally {
    if (refreshLeases.get(key) === lease) refreshLeases.delete(key)
  }
}
