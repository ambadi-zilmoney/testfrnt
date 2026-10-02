import StatusBadge from './StatusBadge.jsx'

export default function Navbar({ apiUp }) {
  return (
    <nav className="nav">
      <div className="wrap">
        <a href="#top" className="brand">
          <span className="brand-mark">◆</span>
          Itemly
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#items">Items</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-right">
          <StatusBadge up={apiUp} />
          <a href="#items" className="btn btn-primary">Get started</a>
        </div>
      </div>
    </nav>
  )
}
