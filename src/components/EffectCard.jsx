import { Link } from 'react-router-dom';
import { categoryById } from '../effects/effects.js';

// CSS-only preview compositions keyed by category, varied per effect
function previewStyle(effect, index) {
  const cat = categoryById[effect.category];
  const h = (cat.hue + index * 18) % 360;
  const base = `linear-gradient(135deg, hsl(${h} 45% 22%), hsl(${(h + 40) % 360} 50% 12%) 60%, #0c0c0e)`;

  switch (effect.category) {
    case 'glitch':
      return {
        backgroundImage: `repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.45) 3px 4px), linear-gradient(90deg, hsl(${h} 70% 45% / 0.5) 0 2%, transparent 2% 31%, hsl(${(h + 180) % 360} 70% 50% / 0.4) 31% 33%, transparent 33% 74%, hsl(${h} 80% 60% / 0.5) 74% 75%, transparent 75%), ${base}`,
      };
    case 'distortion':
      return {
        backgroundImage: `repeating-conic-gradient(from ${index * 30}deg at 65% 40%, hsl(${h} 50% 35% / 0.55) 0deg 20deg, transparent 20deg 40deg), ${base}`,
      };
    case 'color':
      return {
        backgroundImage: `radial-gradient(ellipse at 70% 30%, hsl(${h} 90% 55% / 0.55), transparent 55%), radial-gradient(ellipse at 25% 75%, hsl(${(h + 90) % 360} 80% 45% / 0.4), transparent 60%), ${base}`,
      };
    case 'retro':
      return {
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.22) 1px, transparent 1.6px), ${base}`,
        backgroundSize: '7px 7px, cover',
      };
    case 'ethereal':
      return {
        backgroundImage: `radial-gradient(ellipse at 50% 110%, hsl(${h} 60% 60% / 0.45), transparent 65%), radial-gradient(ellipse at 80% 0%, hsl(${(h + 60) % 360} 55% 65% / 0.3), transparent 55%), ${base}`,
      };
    default:
      return { backgroundImage: base };
  }
}

export default function EffectCard({ effect, index = 0 }) {
  const cat = categoryById[effect.category];
  return (
    <div className="effect-card">
      <div className="effect-preview" style={previewStyle(effect, index)}>
        <span className="effect-tag">{cat.name}</span>
      </div>
      <div className="effect-body">
        <h3>{effect.name}</h3>
        <p>{effect.description}</p>
      </div>
      <div className="effect-actions">
        <Link to={`/video/${effect.id}`}>Video</Link>
        <Link to={`/photo/${effect.id}`}>Photo</Link>
        <span className="effect-params-count">{effect.params.length} params</span>
      </div>
    </div>
  );
}
