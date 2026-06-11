import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-mark" />
          <span>ETHEREA</span>
          <p>Real-time VFX in the browser. Files never leave your device.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Tools</h4>
            <Link to="/video">Video editor</Link>
            <Link to="/photo">Photo editor</Link>
            <Link to="/effects">All effects</Link>
          </div>
          <div>
            <h4>Studio</h4>
            <Link to="/studio">Services</Link>
            <a href="mailto:hello@etherea.app">hello@etherea.app</a>
          </div>
        </div>
      </div>
      <div className="footer-meta">
        <span>WEBGL 1.0</span>
        <span>MP4 / WEBM / PNG / JPG</span>
        <span>NO ACCOUNT · NO WATERMARK · NO UPLOAD</span>
      </div>
    </footer>
  );
}
