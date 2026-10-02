import { useState } from 'react'

export default function ItemForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setError('')
    try {
      await onSubmit(name.trim())
      setName('')
    } catch (err) {
      setError(err.errors?.name || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New item name"
          maxLength={255}
          aria-label="Item name"
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
