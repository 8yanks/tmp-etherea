import { NavLink, Link } from 'react-router-dom';

export default function Nav() {
  return (
    <header className="nav">
      <Link to="/" className="logo">
        <span className="logo-mark" />
        ETHEREA
        <span className="logo-meta">browser VFX</span>
      </Link>
      <nav className="nav-links">
        <NavLink to="/effects">Effects</NavLink>
        <NavLink to="/studio">Studio</NavLink>
        <span className="nav-divider" />
        <NavLink to="/video" className="nav-tool">
          Video
        </NavLink>
        <NavLink to="/photo" className="nav-tool">
          Photo
        </NavLink>
      </nav>
    </header>
  );
}
