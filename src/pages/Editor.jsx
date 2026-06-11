import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EFFECTS, byId, CATEGORIES, categoryById } from '../effects/effects.js';
import { GLRenderer, PREVIEW_DIM, EXPORT_DIM, PHOTO_EXPORT_DIM } from '../gl/renderer.js';

function defaults(effect) {
  return Object.fromEntries(effect.params.map((p) => [p.key, p.value]));
}

export default function Editor({ mode }) {
  const isVideo = mode === 'video';
  const { effectId } = useParams();
  const effect = byId[effectId] || EFFECTS[0];
  const usesTime = effect.frag.includes('u_time');

  const [media, setMedia] = useState(null); // { url, name }
  const [params, setParams] = useState(() => defaults(effect));
  const [variation, setVariation] = useState(2);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const rendererRef = useRef(null);
  const paramsRef = useRef(params);
  const variationRef = useRef(variation);
  const rafRef = useRef(0);
  const dirtyRef = useRef(true);
  const lastFrameRef = useRef(-1);

  paramsRef.current = params;
  variationRef.current = variation;

  useEffect(() => {
    setParams(defaults(effect));
  }, [effect]);

  // Reset media when switching between video and photo editors
  useEffect(() => {
    setMedia(null);
    setError('');
  }, [mode]);

  const loadFile = useCallback(
    (file) => {
      if (!file) return;
      const ok = isVideo ? file.type.startsWith('video/') : file.type.startsWith('image/');
      if (!ok) {
        setError(
          isVideo
            ? 'This is the video editor — please choose a video file. For photos, use the photo editor.'
            : 'This is the photo editor — please choose an image file. For videos, use the video editor.'
        );
        return;
      }
      setError('');
      if (media?.url) URL.revokeObjectURL(media.url);
      setMedia({ url: URL.createObjectURL(file), name: file.name });
      setPlaying(true);
    },
    [media, isVideo]
  );

  // Mark the frame dirty whenever settings change
  useEffect(() => {
    dirtyRef.current = true;
  }, [params, variation, effect]);

  // Renderer setup + video render loop
  useEffect(() => {
    if (!media || !canvasRef.current) return;
    let renderer;
    try {
      renderer = new GLRenderer(canvasRef.current);
      renderer.setEffect(effect);
    } catch (e) {
      setError(e.message);
      return;
    }
    rendererRef.current = renderer;
    dirtyRef.current = true;
    lastFrameRef.current = -1;

    if (!isVideo) return;

    // Only redraw when the video has a new frame or settings changed
    const start = performance.now();
    const loop = (now) => {
      const v = videoRef.current;
      if (v && v.readyState >= 2) {
        const newFrame = v.currentTime !== lastFrameRef.current;
        if (newFrame || dirtyRef.current) {
          renderer.draw(v, paramsRef.current, (now - start) / 1000);
          lastFrameRef.current = v.currentTime;
          dirtyRef.current = false;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [media, effect, isVideo]);

  // Photo: render on demand instead of a continuous loop
  useEffect(() => {
    if (isVideo || !media) return;
    const img = imageRef.current;
    const renderer = rendererRef.current;
    if (!img || !renderer) return;
    const drawOnce = () => renderer.draw(img, paramsRef.current, variationRef.current);
    if (img.complete && img.naturalWidth > 0) drawOnce();
    else img.onload = drawOnce;
  }, [media, effect, isVideo, params, variation]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo || !media) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, media, isVideo]);

  const exportImage = (type, ext) => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    // Photos re-render at full resolution before saving
    if (!isVideo && imageRef.current) {
      renderer.setMaxDim(PHOTO_EXPORT_DIM);
      renderer.draw(imageRef.current, paramsRef.current, variationRef.current);
    }

    canvas.toBlob(
      (blob) => {
        if (!isVideo && imageRef.current) {
          renderer.setMaxDim(PREVIEW_DIM);
          renderer.draw(imageRef.current, paramsRef.current, variationRef.current);
        }
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `etherea-${effect.id}.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      type,
      0.92
    );
  };

  const exportVideo = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !video || recording) return;

    // Record at full quality, then drop back to the lighter preview size
    renderer?.setMaxDim(EXPORT_DIM);
    dirtyRef.current = true;

    const stream = canvas.captureStream(30);
    try {
      const audioTracks = video.captureStream?.().getAudioTracks?.() || [];
      audioTracks.forEach((t) => stream.addTrack(t));
    } catch {
      /* audio capture unsupported — export video only */
    }

    const mime = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm',
    ].find((m) => MediaRecorder.isTypeSupported(m));
    if (!mime) {
      setError('Video recording is not supported in this browser.');
      return;
    }

    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `etherea-${effect.id}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      video.loop = true;
      renderer?.setMaxDim(PREVIEW_DIM);
      dirtyRef.current = true;
      setRecording(false);
    };

    const onEnded = () => {
      video.removeEventListener('ended', onEnded);
      rec.stop();
    };

    video.loop = false;
    video.currentTime = 0;
    video.addEventListener('ended', onEnded);
    video.play().then(() => {
      setRecording(true);
      setPlaying(true);
      rec.start();
    });
  };

  const stopRecording = () => {
    const video = videoRef.current;
    if (video) video.dispatchEvent(new Event('ended'));
  };

  const cat = categoryById[effect.category];
  const otherMode = isVideo ? 'photo' : 'video';

  return (
    <section className="editor page-top">
      <aside className="editor-side">
        <Link to="/effects" className="back-link">
          ← All effects
        </Link>
        <div className="mode-row">
          <span className={`mode-badge ${mode}`}>{isVideo ? 'Video editor' : 'Photo editor'}</span>
          <Link to={`/${otherMode}/${effect.id}`} className="mode-switch">
            Switch to {otherMode} →
          </Link>
        </div>
        <span className="effect-cat" style={{ color: `hsl(${cat.hue} 85% 75%)` }}>
          {cat.name}
        </span>
        <h1>{effect.name}</h1>
        <p className="editor-desc">{effect.description}</p>

        <div className="sliders">
          {effect.params.map((p) => (
            <label key={p.key} className="slider-row">
              <span className="slider-label">
                {p.label}
                <em>{Number(params[p.key]).toFixed(p.step >= 1 ? 0 : 3)}</em>
              </span>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={params[p.key]}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [p.key]: parseFloat(e.target.value) }))
                }
              />
            </label>
          ))}
          {!isVideo && usesTime && (
            <label className="slider-row">
              <span className="slider-label">
                Variation
                <em>{variation.toFixed(1)}</em>
              </span>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={variation}
                onChange={(e) => setVariation(parseFloat(e.target.value))}
              />
            </label>
          )}
        </div>
        <button className="btn btn-ghost btn-small" onClick={() => setParams(defaults(effect))}>
          Reset settings
        </button>

        <h4 className="switch-title">Switch effect</h4>
        <div className="effect-switcher">
          {CATEGORIES.map((c) => (
            <div key={c.id}>
              <span className="switch-cat" style={{ color: `hsl(${c.hue} 80% 72%)` }}>
                {c.name}
              </span>
              <div className="switch-list">
                {EFFECTS.filter((e) => e.category === c.id).map((e) => (
                  <Link
                    key={e.id}
                    to={`/${mode}/${e.id}`}
                    className={`switch-item ${e.id === effect.id ? 'active' : ''}`}
                  >
                    {e.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="editor-main">
        {!media ? (
          <div
            className={`dropzone glass ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              loadFile(e.dataTransfer.files[0]);
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <div className="drop-orb" />
            <h2>{isVideo ? 'Drop a video here' : 'Drop a photo here'}</h2>
            <p>or click to browse — your file never leaves this device</p>
            <input
              id="file-input"
              type="file"
              accept={isVideo ? 'video/*' : 'image/*'}
              hidden
              onChange={(e) => loadFile(e.target.files[0])}
            />
          </div>
        ) : (
          <>
            <div className="canvas-wrap">
              <canvas ref={canvasRef} />
              {recording && <span className="rec-badge">● Recording</span>}
            </div>

            <div className="editor-toolbar">
              <span className="file-name" title={media.name}>
                {media.name}
              </span>
              <div className="toolbar-actions">
                {isVideo ? (
                  <>
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => setPlaying(!playing)}
                    >
                      {playing ? 'Pause' : 'Play'}
                    </button>
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => exportImage('image/png', 'png')}
                    >
                      Export frame
                    </button>
                    {recording ? (
                      <button className="btn btn-danger btn-small" onClick={stopRecording}>
                        Stop & save
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-small" onClick={exportVideo}>
                        Export video
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => exportImage('image/jpeg', 'jpg')}
                    >
                      Export JPG
                    </button>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => exportImage('image/png', 'png')}
                    >
                      Export PNG
                    </button>
                  </>
                )}
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => {
                    URL.revokeObjectURL(media.url);
                    setMedia(null);
                  }}
                >
                  New file
                </button>
              </div>
            </div>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}

        {isVideo && media && (
          <video ref={videoRef} src={media.url} loop muted playsInline hidden />
        )}
        {!isVideo && media && <img ref={imageRef} src={media.url} alt="" hidden />}
      </div>
    </section>
  );
}

