# Etherea

Real-time VFX for video & photo, entirely in the browser. 25 GPU effects (GLSL shaders on WebGL) — glitch, distortion, color & light, retro, ethereal. Drop a file, tune the parameters, export. No install, no account, no watermark, and files never leave your device.

## Features

- **25 real-time effects** across 5 categories, each with adjustable shader parameters
- **Separate video and photo editors** — video records to MP4/WebM (up to 1080p), photos export full-resolution PNG/JPG (up to 4K)
- **Everything is local** — decoding, rendering and export happen on your GPU; nothing is uploaded
- Performance-aware rendering: photos draw on demand, videos redraw only on new frames, preview capped at 1280px with full-resolution exports

## Stack

- React 19 + Vite
- Custom WebGL 1.0 renderer (`src/gl/renderer.js`)
- Effect library as GLSL fragment shaders (`src/effects/effects.js`)
- React Router, no other runtime dependencies

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Adding an effect

Add an entry to `EFFECTS` in `src/effects/effects.js`: an id, name, category, description, a list of params (`key`, `label`, `min`, `max`, `step`, `value`) and a GLSL fragment shader using the injected uniforms (`u_tex`, `u_time`, `u_res`, plus one float uniform per param). It appears everywhere automatically.
