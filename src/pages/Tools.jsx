import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CATEGORIES, EFFECTS, byCategory } from '../effects/effects.js';
import EffectCard from '../components/EffectCard.jsx';

export default function Tools() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      if (CATEGORIES.some((c) => c.id === id)) setFilter(id);
    }
  }, [hash]);

  const visible = EFFECTS.filter(
    (e) =>
      (filter === 'all' || e.category === filter) &&
      (query === '' ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <section className="page-top">
      <h1 className="page-title">Effects</h1>
      <p className="page-sub">
        {EFFECTS.length} GPU effects, rendered in real time. Every one works on video and photo.
      </p>

      <div className="tools-controls">
        <div className="pills">
          <button
            className={`pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`pill ${filter === c.id ? 'active' : ''}`}
              style={{ '--cat-hue': c.hue }}
              onClick={() => setFilter(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search effects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filter === 'all' && query === '' ? (
        CATEGORIES.map((c) => (
          <div key={c.id} id={c.id} className="cat-section">
            <h2 className="cat-heading" style={{ '--cat-hue': c.hue }}>
              {c.name}
            </h2>
            <p className="cat-tagline">{c.tagline}</p>
            <div className="effect-grid">
              {byCategory(c.id).map((e, i) => (
                <EffectCard key={e.id} effect={e} index={i} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="effect-grid">
          {visible.map((e, i) => (
            <EffectCard key={e.id} effect={e} index={i} />
          ))}
          {visible.length === 0 && <p className="empty">No effects match “{query}”.</p>}
        </div>
      )}
    </section>
  );
}
