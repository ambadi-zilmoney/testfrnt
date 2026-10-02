export default function StatusBadge({ up }) {
  const state = up === null ? '' : up ? 'ok' : 'down'
  const label = up === null ? 'Checking API…' : up ? 'API online' : 'API offline'
  return (
    <span className={`badge ${state}`} title={label}>
      <span className="dot" aria-hidden="true" />
      {label}
    </span>
  )
}
