import ItemForm from './ItemForm.jsx'
import ItemList from './ItemList.jsx'

export default function ItemsSection({ items, loading, error, onCreate, onDelete, onRetry }) {
  return (
    <section className="section" id="items">
      <div className="wrap">
        <div className="section-head">
          <h2>Item manager</h2>
          <p>Add and remove items. Changes are saved to the database instantly.</p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Your items</h3>
              <p className="count">
                {loading ? 'Loading…' : `${items.length} item${items.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button className="btn btn-outline" onClick={onRetry} disabled={loading}>
              ↻ Refresh
            </button>
          </div>

          <div className="panel-body">
            <ItemForm onSubmit={onCreate} />

            {error && (
              <div className="alert" role="alert">
                <span>{error}</span>
                <button className="btn-link" onClick={onRetry}>Try again</button>
              </div>
            )}

            {loading ? (
              <div className="items" aria-busy="true">
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
              </div>
            ) : (
              <ItemList items={items} onDelete={onDelete} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
