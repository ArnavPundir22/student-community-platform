const envApiUrl = import.meta.env.VITE_API_URL
export const API_BASE = envApiUrl
  ? (envApiUrl.endsWith('/api/v1') ? envApiUrl : `${envApiUrl.replace(/\/$/, '')}/api/v1`)
  : (typeof window !== 'undefined' && window.location.origin.includes(':5173')
      ? 'http://localhost:3333/api/v1'
      : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1`)

export interface ApiFetchOptions extends RequestInit {
  onForbidden?: (message: string) => void
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem('app_token')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  }

  try {
    const res = await fetch(url, config)
    let data: any = null
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await res.json()
    } else {
      const text = await res.text()
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    if (res.status === 403) {
      const errMsg = (data && data.message) ? data.message : 'Action forbidden: requires Community Owner permissions'
      if (options.onForbidden) {
        options.onForbidden(errMsg)
      }
    }

    return {
      ok: res.ok,
      status: res.status,
      data: data as T,
      error: !res.ok ? ((data && data.message) ? data.message : `HTTP ${res.status}`) : undefined,
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message || 'Network error',
    }
  }
}
