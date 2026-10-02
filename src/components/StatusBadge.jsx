export default function StatusBadge({ up }) {
  if (up === null) return <span className="badge">checking…</span>
  return <span className={`badge ${up ? 'ok' : 'down'}`}>API {up ? 'online' : 'offline'}</span>
}
