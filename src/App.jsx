import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Tools from './pages/Tools.jsx';
import Editor from './pages/Editor.jsx';
import Studio from './pages/Studio.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/effects" element={<Tools />} />
          <Route path="/video/:effectId" element={<Editor mode="video" />} />
          <Route path="/video" element={<Editor mode="video" />} />
          <Route path="/photo/:effectId" element={<Editor mode="photo" />} />
          <Route path="/photo" element={<Editor mode="photo" />} />
          <Route path="/studio" element={<Studio />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
