export default function Footer() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  return (
    <footer className="footer" id="about">
      <div className="wrap">
        <span>© {new Date().getFullYear()} Itemly · React + PHP + MySQL</span>
        <span>API: <code>{apiBase}</code></span>
      </div>
    </footer>
  )
}
