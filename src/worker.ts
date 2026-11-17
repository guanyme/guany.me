import { serve } from './server'
import { auditKvWrites } from './server/kv-write-audit'
import type { RuntimeEnvironment } from './server/runtime-environment.server'

interface Env extends RuntimeEnvironment {
  KV_WRITE_AUDIT_UNTIL?: string
}

type WorkerRequest = Request & { cf?: { colo?: string } }

export default {
  fetch(request: WorkerRequest, env: Env) {
    const binding = env.PUBLIC_DATA_CACHE
    const until = Date.parse(env.KV_WRITE_AUDIT_UNTIL ?? '')
    if (!binding || !(Date.now() < until)) return serve(request, env)

    const requestColo = request.cf?.colo ?? ''
    const colo = /^[A-Z]{3}$/.test(requestColo) ? requestColo : 'unknown'
    return serve(request, { ...env, PUBLIC_DATA_CACHE: auditKvWrites(binding, until, colo) })
  },
}
