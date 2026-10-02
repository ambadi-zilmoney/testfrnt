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
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What do you want to add?"
          maxLength={255}
          aria-label="Item name"
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
          {submitting ? 'Adding…' : '+ Add item'}
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  )
}
