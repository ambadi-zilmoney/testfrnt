export default function ItemList({ items, onDelete }) {
  if (items.length === 0) {
    return <p className="muted">No items yet.</p>
  }

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id}>
          <span>{item.name}</span>
          <button className="danger" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
