const FEATURES = [
  {
    icon: '⚡',
    title: 'Global CDN frontend',
    text: 'The React app is served as static files from S3 + CloudFront, so it loads fast from anywhere.',
  },
  {
    icon: '🔒',
    title: 'HTTPS everywhere',
    text: 'The site and the API both run on TLS. The API only accepts requests from this site’s domain.',
  },
  {
    icon: '🔁',
    title: 'Resilient by default',
    text: 'Requests retry automatically, saves never duplicate, and the page reconnects on its own after an outage.',
  },
  {
    icon: '🐳',
    title: 'Dockerised API',
    text: 'Two PHP replicas behind nginx with zero-downtime deploys and daily database backups.',
  },
]

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <div className="section-head">
          <h2>Built for production</h2>
          <p>A simple app, hosted the way real products are.</p>
        </div>
        <div className="features">
          {FEATURES.map((f) => (
            <article className="feature" key={f.title}>
              <div className="feature-icon" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
