import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { useConnection } from './hooks/useConnection.js'
import ConnectionBanner from './components/ConnectionBanner.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Features from './components/Features.jsx'
import ItemsSection from './components/ItemsSection.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(async () => {
    setLoading(true)
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
    setError('')
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
      <Navbar apiUp={loading && !error ? null : !connection.degraded && !error} />
      <main>
        <Hero />
        <Features />
        <ItemsSection
          items={items}
          loading={loading}
          error={error}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onRetry={loadItems}
        />
      </main>
      <Footer />
    </>
  )
}
