/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    PUBLIC_DATA_CACHE?: KVNamespace
    GITHUB_OWNER?: string
    GITHUB_TOKEN?: string
    SITE_CONFIG_URL?: string
  }
}
