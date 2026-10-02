export default function ConnectionBanner({ online, degraded }) {
  if (!degraded) return null

  return (
    <div className="banner" role="status" aria-live="polite">
      {online
        ? 'Having trouble reaching the server. Reconnecting automatically…'
        : 'You are offline. Changes will work again once you reconnect.'}
    </div>
  )
}
