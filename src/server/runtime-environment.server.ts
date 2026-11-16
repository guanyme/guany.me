import '@tanstack/react-start/server-only'
import { AsyncLocalStorage } from 'node:async_hooks'

export interface RuntimeEnvironment {
  GITHUB_OWNER?: string
  GITHUB_TOKEN?: string
  SITE_CONFIG_URL?: string
  PUBLIC_DATA_CACHE?: {
    get(key: string, type: 'json'): Promise<unknown>
    put(key: string, value: string): Promise<void>
  }
}

const runtimeEnvironments = new AsyncLocalStorage<RuntimeEnvironment>()

export function getRuntimeEnvironment() {
  const runtime = runtimeEnvironments.getStore()
  if (!runtime) throw new Error('Request runtime is unavailable')
  return runtime
}

export function withRuntimeEnvironment<T>(env: RuntimeEnvironment, handle: () => T) {
  return runtimeEnvironments.run(env, handle)
}
