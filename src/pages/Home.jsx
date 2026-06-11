import { Link } from 'react-router-dom';
import { CATEGORIES, EFFECTS, byCategory } from '../effects/effects.js';
import EffectCard from '../components/EffectCard.jsx';

const DEMO_PARAMS = [
  { label: 'hue', value: 0.55, pct: 55 },
  { label: 'glow', value: 1.8, pct: 45 },
  { label: 'mix_original', value: 0.1, pct: 10 },
];

export default function Home() {
  const featured = ['neon-edge', 'dream-glow', 'kaleidoscope', 'vhs']
    .map((id) => EFFECTS.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">Free · runs in your browser · files stay local</p>
          <h1>
            Real-time VFX
            <br />
            for video <span className="accent">&</span> photo
          </h1>
          <p className="hero-sub">
            {EFFECTS.length} GPU effects — glitch, distortion, color, retro, ethereal. Drop a file,
            tune the parameters, export. No install, no account, no watermark.
          </p>
          <div className="hero-actions">
            <Link to="/video" className="btn btn-primary">
              Open video editor
            </Link>
            <Link to="/photo" className="btn btn-secondary">
              Open photo editor
            </Link>
            <Link to="/effects" className="hero-link">
              Browse all effects →
            </Link>
          </div>
        </div>

        <div className="hero-demo" aria-hidden="true">
          <div className="demo-titlebar">
            <span className="demo-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="demo-file">neon-edge</span>
            <span className="demo-engine">WEBGL · 60FPS</span>
          </div>
          <div className="demo-body">
            <div className="demo-preview">
              <div className="demo-visual" />
              <span className="demo-res">1280 × 720</span>
            </div>
            <div className="demo-params">
              {DEMO_PARAMS.map((p) => (
                <div key={p.label} className="demo-param">
                  <span className="demo-param-head">
                    {p.label}
                    <em>{p.value}</em>
                  </span>
                  <span className="demo-track">
                    <span className="demo-fill" style={{ width: `${p.pct}%` }} />
                  </span>
                </div>
              ))}
              <div className="demo-export">EXPORT — MP4 · WEBM · PNG</div>
            </div>
          </div>
        </div>
      </section>

      <div className="meta-strip" aria-hidden="true">
        <span>{EFFECTS.length} EFFECTS</span>
        <span>GLSL SHADERS</span>
        <span>REAL-TIME PREVIEW</span>
        <span>MP4 / WEBM / PNG</span>
        <span>NOTHING UPLOADED</span>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Categories</h2>
          <p>Every effect works on both video and photo.</p>
        </div>
        <div className="cat-list">
          {CATEGORIES.map((c, i) => (
            <Link key={c.id} to={`/effects#${c.id}`} className="cat-row">
              <span className="cat-index">0{i + 1}</span>
              <span className="cat-name">{c.name}</span>
              <span className="cat-desc">{c.tagline}</span>
              <span className="cat-meta">{byCategory(c.id).length} effects</span>
              <span className="cat-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Start here</h2>
          <p>Four effects that show the range.</p>
        </div>
        <div className="effect-grid">
          {featured.map((e, i) => (
            <EffectCard key={e.id} effect={e} index={i * 3} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Workflow</h2>
        </div>
        <div className="flow">
          <div className="flow-row">
            <span className="flow-num">01</span>
            <div>
              <h3>Drop a file</h3>
              <p>
                Any video or image. Decoding and rendering happen on your GPU — the file never
                leaves your device.
              </p>
            </div>
          </div>
          <div className="flow-row">
            <span className="flow-num">02</span>
            <div>
              <h3>Tune in real time</h3>
              <p>
                Each effect exposes its shader parameters as sliders. Changes render on the next
                frame.
              </p>
            </div>
          </div>
          <div className="flow-row">
            <span className="flow-num">03</span>
            <div>
              <h3>Export</h3>
              <p>
                Video records to MP4 or WebM at up to 1080p. Photos render at full resolution to
                PNG or JPG.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div>
          <h2>Need something built?</h2>
          <p>Etherea Studio ships websites, web apps and interactive 3D for creative teams.</p>
        </div>
        <Link to="/studio" className="btn btn-secondary">
          Visit the studio
        </Link>
      </section>
    </>
  );
}
