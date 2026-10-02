const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value.replace(' ', 'T') + 'Z') // MySQL "YYYY-MM-DD HH:MM:SS" is UTC
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export default function ItemList({ items, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon" aria-hidden="true">📭</div>
        <p>No items yet. Add your first one above.</p>
      </div>
    )
  }

  return (
    <ul className="items">
      {items.map((item) => (
        <li className="item" key={item.id}>
          <div className="item-avatar" aria-hidden="true">{item.name.charAt(0).toUpperCase()}</div>
          <div className="item-main">
            <div className="item-name">{item.name}</div>
            <div className="item-meta">#{item.id}{item.created_at ? ` · added ${formatDate(item.created_at)}` : ''}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
