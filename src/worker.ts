import { serve } from './server'
import type { RuntimeEnvironment } from './server/runtime-environment.server'

export default {
  fetch(request: Request, env: RuntimeEnvironment) {
    return serve(request, env)
  },
}
