import handler from '@tanstack/react-start/server-entry'
import { paraglideMiddleware } from '#/paraglide/server.js'

import {
  withRuntimeEnvironment,
  type RuntimeEnvironment,
} from '#/server/runtime-environment.server'

export function serve(request: Request, runtime: RuntimeEnvironment): Promise<Response> {
  return withRuntimeEnvironment(runtime, () =>
    paraglideMiddleware(request, () => handler.fetch(request)),
  )
}

export default {
  fetch(request: Request): Promise<Response> {
    return serve(request, {
      GITHUB_OWNER: process.env.GITHUB_OWNER,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      SITE_CONFIG_URL: process.env.SITE_CONFIG_URL,
    })
  },
}
