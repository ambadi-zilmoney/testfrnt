// Resilient API client for https://api.example.com
//
//  - Timeout on every request
//  - Retries with exponential backoff + jitter on network errors and 408/429/502/503/504,
//    honouring the server's Retry-After header
//  - POSTs carry an Idempotency-Key (reused across retries) so a retry can't create duplicates
//  - Circuit breaker: after repeated failures, fail fast for a cooldown instead of hammering
//    a struggling backend, then let one trial request through
//  - Connection state (online / circuit) is observable for the UI

// Dev: "/api" via the Vite proxy. Production: the full API URL from .env.production.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const CONFIG = {
  timeoutMs: 10_000,
  maxRetries: 3,
  baseDelayMs: 300,
  maxDelayMs: 5_000,
  breakerThreshold: 5, // consecutive failed requests before opening the circuit
  breakerCooldownMs: 15_000,
}

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504])
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'])

export class ApiError extends Error {
  constructor(message, status, { errors = {}, retryable = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.retryable = retryable
  }
}

// ---------------------------------------------------------------------------
// Connection state + circuit breaker
// ---------------------------------------------------------------------------
const listeners = new Set()
const state = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  circuit: 'closed', // closed -> open -> half-open -> closed
  failures: 0,
  openedAt: 0,
}

function emit() {
  const snapshot = getConnectionState()
  listeners.forEach((fn) => fn(snapshot))
}

export function getConnectionState() {
  const retryInMs = state.circuit === 'open' ? Math.max(0, state.openedAt + CONFIG.breakerCooldownMs - Date.now()) : 0
  return { online: state.online, circuit: state.circuit, retryInMs }
}

export function subscribeConnection(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function recordSuccess() {
  if (state.circuit !== 'closed' || state.failures) {
    state.failures = 0
    state.circuit = 'closed'
    emit()
  }
}

function recordFailure() {
  state.failures += 1
  if (state.circuit === 'half-open' || state.failures >= CONFIG.breakerThreshold) {
    state.circuit = 'open'
    state.openedAt = Date.now()
    emit()
  }
}

function checkCircuit() {
  if (state.circuit !== 'open') return
  if (Date.now() - state.openedAt >= CONFIG.breakerCooldownMs) {
    state.circuit = 'half-open' // let one trial request through
    emit()
    return
  }
  throw new ApiError('Service temporarily unavailable. Retrying shortly…', 0, { retryable: true })
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    state.online = true
    if (state.circuit === 'open') state.circuit = 'half-open' // try again right away
    emit()
  })
  window.addEventListener('offline', () => {
    state.online = false
    emit()
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function backoffDelay(attempt) {
  const exp = Math.min(CONFIG.maxDelayMs, CONFIG.baseDelayMs * 2 ** attempt)
  return exp / 2 + Math.random() * (exp / 2) // "equal jitter" spreads out retry storms
}

function retryAfterMs(res) {
  const header = res.headers.get('Retry-After')
  if (!header) return null
  const seconds = Number(header)
  const ms = Number.isFinite(seconds) ? seconds * 1000 : new Date(header).getTime() - Date.now()
  return Math.min(Math.max(ms, 0), CONFIG.maxDelayMs * 2)
}

function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------
async function request(path, { method = 'GET', body, timeoutMs = CONFIG.timeoutMs, maxRetries = CONFIG.maxRetries } = {}) {
  checkCircuit()

  // Only send Content-Type with a body: on a cross-origin API it would otherwise
  // force a CORS preflight on every GET.
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  // Same key on every retry, so the server can de-duplicate.
  if (method === 'POST') headers['Idempotency-Key'] = newIdempotencyKey()
  const canRetry = IDEMPOTENT_METHODS.has(method) || 'Idempotency-Key' in headers

  const options = { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }

  for (let attempt = 0; ; attempt++) {
    const isLastAttempt = !canRetry || attempt >= maxRetries
    let res

    try {
      res = await fetchWithTimeout(`${BASE_URL}${path}`, options, timeoutMs)
    } catch (err) {
      // Network failure, DNS failure, CORS rejection or timeout
      if (!isLastAttempt && state.online) {
        await sleep(backoffDelay(attempt))
        continue
      }
      recordFailure()
      const message = !state.online
        ? 'You are offline'
        : err.name === 'AbortError'
          ? 'The server took too long to respond'
          : 'Cannot reach the server'
      throw new ApiError(message, 0, { retryable: true })
    }

    // 409 here = our own earlier attempt is still being processed (idempotency)
    const retryable = RETRYABLE_STATUS.has(res.status) || (res.status === 409 && 'Idempotency-Key' in headers)
    if (retryable && !isLastAttempt) {
      await sleep(retryAfterMs(res) ?? backoffDelay(attempt))
      continue
    }

    if (res.status >= 500 || res.status === 429) recordFailure()
    else recordSuccess()

    if (res.status === 204) return null
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new ApiError(data.error || res.statusText || 'Request failed', res.status, {
        errors: data.errors,
        retryable,
      })
    }
    return data
  }
}

export const api = {
  // Health checks fail fast (no retries) - they're used to detect recovery.
  health: () => request('/health', { maxRetries: 0, timeoutMs: 5_000 }),
  listItems: ({ limit = 50, offset = 0 } = {}) => request(`/items?limit=${limit}&offset=${offset}`),
  createItem: (name) => request('/items', { method: 'POST', body: { name } }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),
}
