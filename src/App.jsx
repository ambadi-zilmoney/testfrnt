import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { useConnection } from './hooks/useConnection.js'
import ConnectionBanner from './components/ConnectionBanner.jsx'
import ItemForm from './components/ItemForm.jsx'
import ItemList from './components/ItemList.jsx'
import StatusBadge from './components/StatusBadge.jsx'

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(async () => {
    setError('')
    try {
      const { data } = await api.listItems()
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // When the API comes back after an outage, refresh the data automatically.
  const connection = useConnection(loadItems)

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleCreate = async (name) => {
    const { data } = await api.createItem(name)
    setItems((prev) => [...prev, data])
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <ConnectionBanner online={connection.online} degraded={connection.degraded} />
      <main className="container">
        <header className="header">
          <h1>Items</h1>
          <StatusBadge up={loading ? null : !connection.degraded} />
        </header>

        <ItemForm onSubmit={handleCreate} />

        {error && (
          <p className="error" role="alert">
            {error} <button className="link" onClick={loadItems}>Retry</button>
          </p>
        )}

        {loading ? <p className="muted">Loading…</p> : <ItemList items={items} onDelete={handleDelete} />}
      </main>
    </>
  )
}
