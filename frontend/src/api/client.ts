import { API_BASE_URL } from '../settings/api'

export class ApiError extends Error {
  public readonly status: number
  public readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function parseJsonSafe(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`

  const response = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'content-type': 'application/json' } : {},
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init?.signal,
  })

  if (!response.ok) {
    const details = await parseJsonSafe(response)
    throw new ApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      details,
    )
  }

  const data = await parseJsonSafe(response)
  if (data === null) {
    // APIが JSON を返す前提なので、ここに来たら型不一致の可能性があります。
    throw new ApiError('API response is not JSON', response.status)
  }

  return data as T
}

