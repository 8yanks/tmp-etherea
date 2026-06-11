const SERVICES = [
  {
    title: 'E-commerce',
    desc: 'Stores and product pages built to convert, from catalog to checkout.',
  },
  {
    title: 'Web apps & MVPs',
    desc: 'Full-featured applications shipped in weeks, not quarters.',
  },
  {
    title: '3D & interactive',
    desc: 'Browser-native Three.js experiences that make people stop scrolling.',
  },
  {
    title: 'Portfolio & brand sites',
    desc: 'Distinctive sites for creatives, agencies and studios.',
  },
  {
    title: 'Backend & APIs',
    desc: 'Solid foundations: data models, integrations and infrastructure.',
  },
  {
    title: 'AI integration',
    desc: 'Practical AI features wired into your product, not bolted on.',
  },
];

const PROCESS = [
  { step: 'Discover', desc: 'We map your goals, audience and constraints.' },
  { step: 'Design', desc: 'Interface and experience, prototyped fast.' },
  { step: 'Build', desc: 'Short iterations with working software every week.' },
  { step: 'Launch', desc: 'Ship, measure and keep improving.' },
];

export default function Studio() {
  return (
    <section className="page-top">
      <p className="kicker">Etherea Studio</p>
      <h1 className="page-title">
        The team behind the tools<span className="accent">.</span>
      </h1>
      <p className="page-sub">
        We design and ship custom websites, applications and interactive experiences — the same
        engineering that powers this platform, applied to your product.
      </p>

      <div className="service-grid">
        {SERVICES.map((s) => (
          <div key={s.title} className="service-card">
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title small">How we work</h2>
      <div className="process">
        {PROCESS.map((p, i) => (
          <div key={p.step} className="process-step">
            <span className="step-num">0{i + 1}</span>
            <div>
              <h3>{p.step}</h3>
              <p>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="band contact-cta">
        <div>
          <h2>Have a project in mind?</h2>
          <p>Tell us what you&apos;re building — we usually reply within a day.</p>
        </div>
        <a href="mailto:hello@etherea.app" className="btn btn-primary">
          hello@etherea.app
        </a>
      </div>
    </section>
  );
}
