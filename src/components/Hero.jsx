export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        <span className="eyebrow">React · PHP · MySQL</span>
        <h1>
          Manage your items with a <span>fast, reliable</span> cloud stack
        </h1>
        <p>
          A React frontend served from a global CDN, talking to a PHP API running in Docker.
          Everything you add below is stored in MySQL through the API in real time.
        </p>
        <div className="hero-actions">
          <a href="#items" className="btn btn-primary">Open the item manager</a>
          <a href="#features" className="btn btn-outline">See how it works</a>
        </div>
      </div>
    </header>
  )
}
