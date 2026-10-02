import { useEffect, useRef, useState } from 'react'
import { api, getConnectionState, subscribeConnection } from '../api.js'

const RECOVERY_POLL_MS = 5_000

/**
 * Tracks connection health. While the API is unreachable it polls /health in the
 * background and calls `onRecovered` once the API answers again, so the UI
 * repairs itself without the user having to reload.
 */
export function useConnection(onRecovered) {
  const [conn, setConn] = useState(getConnectionState)
  const onRecoveredRef = useRef(onRecovered)
  onRecoveredRef.current = onRecovered

  useEffect(() => subscribeConnection(setConn), [])

  const degraded = !conn.online || conn.circuit !== 'closed'

  useEffect(() => {
    if (!degraded) return undefined

    const timer = setInterval(async () => {
      if (!navigator.onLine) return
      try {
        await api.health()
        onRecoveredRef.current?.()
      } catch {
        // still down - keep polling
      }
    }, RECOVERY_POLL_MS)

    return () => clearInterval(timer)
  }, [degraded])

  return { ...conn, degraded }
}
