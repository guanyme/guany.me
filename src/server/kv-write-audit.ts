import { createHash } from 'node:crypto'
import type { RuntimeEnvironment } from './runtime-environment.server'

type PublicDataCache = NonNullable<RuntimeEnvironment['PUBLIC_DATA_CACHE']>

function auditKey(key: string, value: string): string {
  // The cache serializes value before refreshAfter. Missing content can contain caller-supplied names.
  if (!value.startsWith('{"value":null,')) return key
  const family = /^public-data:v1:github:(?:repo|readme|markdown):/.exec(key)?.[0] ?? 'public-data:v1:'
  const digest = createHash('sha256').update(key).digest('hex')
  return `${family}sha256:${digest}`
}

export function auditKvWrites(binding: PublicDataCache, until: number, colo: string): PublicDataCache {
  return {
    get: (key, type) => binding.get(key, type),
    async put(key, value) {
      const start = Date.now()
      if (start >= until) return binding.put(key, value)

      let result: 'written' | 'failed' = 'failed'
      try {
        await binding.put(key, value)
        result = 'written'
      } finally {
        try {
          console.log({ key: auditKey(key, value), time: new Date(start).toISOString(), colo, result })
        } catch {
          // Keep telemetry failures from replacing the KV outcome.
        }
      }
    },
  }
}
