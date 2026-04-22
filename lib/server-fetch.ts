type ServerFetchInit = RequestInit & {
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 8000

export async function fetchWithTimeout(
  input: string | URL | Request,
  init: ServerFetchInit = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
