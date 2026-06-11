// Shared GLSL helpers injected into shaders that request them
const NOISE = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}
`;

const HSV = `
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
`;

const LUMA = `
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
`;

export const CATEGORIES = [
  {
    id: 'glitch',
    name: 'Glitch',
    tagline: 'Broken signals, split channels and corrupted frames.',
    hue: 320,
  },
  {
    id: 'distortion',
    name: 'Distortion',
    tagline: 'Bend, warp, mirror and melt your footage.',
    hue: 200,
  },
  {
    id: 'color',
    name: 'Color & Light',
    tagline: 'Neon edges, duotones and luminous color grades.',
    hue: 265,
  },
  {
    id: 'retro',
    name: 'Retro',
    tagline: 'Film grain, CRT screens and print-era texture.',
    hue: 30,
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    tagline: 'Dreamy glows, auroras and soft pastel washes.',
    hue: 160,
  },
];

export const EFFECTS = [
  // ---------------- GLITCH ----------------
  {
    id: 'rgb-split',
    name: 'RGB Split',
    category: 'glitch',
    description: 'Separate red, green and blue channels for a classic chromatic glitch.',
    params: [
      { key: 'amount', label: 'Amount', min: 0, max: 0.08, step: 0.001, value: 0.015 },
      { key: 'angle', label: 'Angle', min: 0, max: 6.283, step: 0.01, value: 0 },
      { key: 'pulse', label: 'Pulse', min: 0, max: 1, step: 0.01, value: 0.2 },
    ],
    frag: `
void main() {
  float a = amount * (1.0 + pulse * sin(u_time * 6.0));
  vec2 d = vec2(cos(angle), sin(angle)) * a;
  float r = texture2D(u_tex, v_uv + d).r;
  float g = texture2D(u_tex, v_uv).g;
  float b = texture2D(u_tex, v_uv - d).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}`,
  },
  {
    id: 'glitch-blocks',
    name: 'Glitch Blocks',
    category: 'glitch',
    description: 'Horizontal block displacement with channel swaps, like corrupted video data.',
    params: [
      { key: 'intensity', label: 'Intensity', min: 0, max: 1, step: 0.01, value: 0.35 },
      { key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.01, value: 1 },
      { key: 'blocks', label: 'Block count', min: 4, max: 60, step: 1, value: 24 },
    ],
    frag: NOISE + `
void main() {
  float t = floor(u_time * speed * 8.0);
  vec2 uv = v_uv;
  float block = floor(uv.y * blocks);
  float h = hash(vec2(block, t));
  if (h < intensity) {
    uv.x += (hash(vec2(block, t + 1.0)) - 0.5) * 0.25 * intensity;
  }
  vec4 c = texture2D(u_tex, uv);
  if (h < intensity * 0.4) c.rgb = c.gbr;
  gl_FragColor = c;
}`,
  },
  {
    id: 'vhs',
    name: 'VHS Tape',
    category: 'glitch',
    description: 'Tracking noise, scanlines and color bleed straight from a worn tape.',
    params: [
      { key: 'wobble', label: 'Wobble', min: 0, max: 0.02, step: 0.0005, value: 0.004 },
      { key: 'noiseAmt', label: 'Noise', min: 0, max: 1, step: 0.01, value: 0.25 },
      { key: 'bleed', label: 'Color bleed', min: 0, max: 0.02, step: 0.0005, value: 0.004 },
    ],
    frag: NOISE + LUMA + `
void main() {
  vec2 uv = v_uv;
  uv.x += sin(uv.y * 120.0 + u_time * 4.0) * wobble;
  float tear = step(0.985, hash(vec2(floor(uv.y * 90.0), floor(u_time * 12.0))));
  uv.x += tear * 0.08;
  float r = texture2D(u_tex, uv + vec2(bleed, 0.0)).r;
  float g = texture2D(u_tex, uv).g;
  float b = texture2D(u_tex, uv - vec2(bleed, 0.0)).b;
  vec3 c = vec3(r, g, b);
  float scan = 0.92 + 0.08 * sin(uv.y * u_res.y * 3.14159);
  c *= scan;
  c += (hash(uv * u_res + fract(u_time) * 100.0) - 0.5) * noiseAmt * 0.4;
  c = mix(c, vec3(luma(c)), 0.15);
  gl_FragColor = vec4(c, 1.0);
}`,
  },
  {
    id: 'pixel-smear',
    name: 'Pixel Smear',
    category: 'glitch',
    description: 'Bright pixels melt downward in streaks, inspired by pixel sorting.',
    params: [
      { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01, value: 0.55 },
      { key: 'reach', label: 'Reach', min: 0, max: 0.4, step: 0.005, value: 0.15 },
    ],
    frag: LUMA + `
void main() {
  vec4 c = texture2D(u_tex, v_uv);
  float l = luma(c.rgb);
  if (l > threshold) {
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 14; i++) {
      acc += texture2D(u_tex, v_uv - vec2(0.0, float(i) / 14.0 * reach * l));
    }
    c = acc / 14.0;
  }
  gl_FragColor = c;
}`,
  },
  {
    id: 'signal-noise',
    name: 'Signal Noise',
    category: 'glitch',
    description: 'Static interference and rolling tear lines, like a lost broadcast.',
    params: [
      { key: 'staticAmt', label: 'Static', min: 0, max: 1, step: 0.01, value: 0.35 },
      { key: 'rollSpeed', label: 'Roll speed', min: 0, max: 3, step: 0.01, value: 0.8 },
    ],
    frag: NOISE + `
void main() {
  vec2 uv = v_uv;
  float roll = fract(uv.y + u_time * rollSpeed * 0.2);
  float band = smoothstep(0.0, 0.04, roll) * smoothstep(0.1, 0.06, roll);
  uv.x += band * 0.05;
  vec3 c = texture2D(u_tex, uv).rgb;
  float n = hash(uv * u_res + fract(u_time) * 1000.0);
  c = mix(c, vec3(n), staticAmt * 0.5);
  c *= 1.0 - band * 0.4;
  gl_FragColor = vec4(c, 1.0);
}`,
  },

  // ---------------- DISTORTION ----------------
  {
    id: 'wave-warp',
    name: 'Wave Warp',
    category: 'distortion',
    description: 'Flowing sine waves ripple through the frame.',
    params: [
      { key: 'ampX', label: 'Amplitude X', min: 0, max: 0.1, step: 0.001, value: 0.02 },
      { key: 'ampY', label: 'Amplitude Y', min: 0, max: 0.1, step: 0.001, value: 0.01 },
      { key: 'freq', label: 'Frequency', min: 1, max: 40, step: 0.5, value: 12 },
      { key: 'speed', label: 'Speed', min: 0, max: 5, step: 0.05, value: 1.5 },
    ],
    frag: `
void main() {
  vec2 uv = v_uv;
  uv.x += sin(uv.y * freq + u_time * speed) * ampX;
  uv.y += cos(uv.x * freq + u_time * speed) * ampY;
  gl_FragColor = texture2D(u_tex, uv);
}`,
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    category: 'distortion',
    description: 'Mirror the frame into rotating symmetrical segments.',
    params: [
      { key: 'segments', label: 'Segments', min: 2, max: 16, step: 1, value: 6 },
      { key: 'spin', label: 'Spin', min: 0, max: 2, step: 0.01, value: 0.15 },
      { key: 'zoom', label: 'Zoom', min: 0.5, max: 2, step: 0.01, value: 1 },
    ],
    frag: `
void main() {
  vec2 p = (v_uv - 0.5) * vec2(u_res.x / u_res.y, 1.0) / zoom;
  float a = atan(p.y, p.x) + u_time * spin;
  float r = length(p);
  float seg = 6.28318 / segments;
  a = mod(a, seg);
  a = abs(a - seg * 0.5);
  vec2 uv = vec2(cos(a), sin(a)) * r + 0.5;
  gl_FragColor = texture2D(u_tex, fract(uv));
}`,
  },
  {
    id: 'bulge',
    name: 'Bulge',
    category: 'distortion',
    description: 'Fisheye-style lens that swells or pinches the center of the frame.',
    params: [
      { key: 'strength', label: 'Strength', min: -1, max: 1, step: 0.01, value: 0.5 },
      { key: 'radius', label: 'Radius', min: 0.1, max: 1.5, step: 0.01, value: 0.8 },
    ],
    frag: `
void main() {
  vec2 p = v_uv - 0.5;
  float r = length(p);
  float f = 1.0 - strength * smoothstep(radius, 0.0, r);
  gl_FragColor = texture2D(u_tex, p * f + 0.5);
}`,
  },
  {
    id: 'mirror',
    name: 'Mirror',
    category: 'distortion',
    description: 'Reflect one half of the frame onto the other for instant symmetry.',
    params: [
      { key: 'axis', label: 'Axis (0=H, 1=V)', min: 0, max: 1, step: 1, value: 0 },
      { key: 'offset', label: 'Offset', min: 0.1, max: 0.9, step: 0.01, value: 0.5 },
    ],
    frag: `
void main() {
  vec2 uv = v_uv;
  if (axis < 0.5) {
    if (uv.x > offset) uv.x = offset * 2.0 - uv.x;
  } else {
    if (uv.y > offset) uv.y = offset * 2.0 - uv.y;
  }
  gl_FragColor = texture2D(u_tex, clamp(uv, 0.0, 1.0));
}`,
  },
  {
    id: 'pixelate',
    name: 'Pixelate',
    category: 'distortion',
    description: 'Chunky mosaic blocks, from subtle texture to full 8-bit.',
    params: [
      { key: 'size', label: 'Block size', min: 4, max: 200, step: 1, value: 60 },
    ],
    frag: `
void main() {
  vec2 grid = vec2(size, size * u_res.y / u_res.x);
  vec2 uv = (floor(v_uv * grid) + 0.5) / grid;
  gl_FragColor = texture2D(u_tex, uv);
}`,
  },
  {
    id: 'liquid-marble',
    name: 'Liquid Marble',
    category: 'distortion',
    description: 'Organic flowing distortion, like ink swirling through water.',
    params: [
      { key: 'amount', label: 'Amount', min: 0, max: 0.3, step: 0.005, value: 0.08 },
      { key: 'scale', label: 'Scale', min: 1, max: 12, step: 0.1, value: 4 },
      { key: 'flow', label: 'Flow speed', min: 0, max: 2, step: 0.01, value: 0.4 },
    ],
    frag: NOISE + `
void main() {
  vec2 p = v_uv * scale;
  float t = u_time * flow;
  vec2 warp = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 uv = v_uv + (warp - 0.5) * amount;
  gl_FragColor = texture2D(u_tex, clamp(uv, 0.0, 1.0));
}`,
  },

  // ---------------- COLOR & LIGHT ----------------
  {
    id: 'neon-edge',
    name: 'Neon Edge',
    category: 'color',
    description: 'Trace every contour in glowing neon lines on black.',
    params: [
      { key: 'hue', label: 'Hue', min: 0, max: 1, step: 0.01, value: 0.55 },
      { key: 'glow', label: 'Glow', min: 0.5, max: 4, step: 0.05, value: 1.8 },
      { key: 'mixOrig', label: 'Mix original', min: 0, max: 1, step: 0.01, value: 0.1 },
    ],
    frag: HSV + LUMA + `
void main() {
  vec2 px = 1.0 / u_res;
  float tl = luma(texture2D(u_tex, v_uv + px * vec2(-1, -1)).rgb);
  float tc = luma(texture2D(u_tex, v_uv + px * vec2(0, -1)).rgb);
  float tr = luma(texture2D(u_tex, v_uv + px * vec2(1, -1)).rgb);
  float ml = luma(texture2D(u_tex, v_uv + px * vec2(-1, 0)).rgb);
  float mr = luma(texture2D(u_tex, v_uv + px * vec2(1, 0)).rgb);
  float bl = luma(texture2D(u_tex, v_uv + px * vec2(-1, 1)).rgb);
  float bc = luma(texture2D(u_tex, v_uv + px * vec2(0, 1)).rgb);
  float br = luma(texture2D(u_tex, v_uv + px * vec2(1, 1)).rgb);
  float gx = tr + 2.0 * mr + br - tl - 2.0 * ml - bl;
  float gy = bl + 2.0 * bc + br - tl - 2.0 * tc - tr;
  float mag = length(vec2(gx, gy)) * glow;
  vec3 neon = hsv2rgb(vec3(fract(hue + mag * 0.15), 0.9, clamp(mag, 0.0, 1.0)));
  vec3 orig = texture2D(u_tex, v_uv).rgb;
  gl_FragColor = vec4(neon + orig * mixOrig, 1.0);
}`,
  },
  {
    id: 'duotone',
    name: 'Duotone',
    category: 'color',
    description: 'Map shadows and highlights to two custom tones.',
    params: [
      { key: 'hueA', label: 'Shadow hue', min: 0, max: 1, step: 0.01, value: 0.7 },
      { key: 'hueB', label: 'Highlight hue', min: 0, max: 1, step: 0.01, value: 0.12 },
      { key: 'sat', label: 'Saturation', min: 0, max: 1, step: 0.01, value: 0.8 },
      { key: 'contrast', label: 'Contrast', min: 0.5, max: 2.5, step: 0.01, value: 1.2 },
    ],
    frag: HSV + LUMA + `
void main() {
  float l = luma(texture2D(u_tex, v_uv).rgb);
  l = clamp((l - 0.5) * contrast + 0.5, 0.0, 1.0);
  vec3 a = hsv2rgb(vec3(hueA, sat, 0.25));
  vec3 b = hsv2rgb(vec3(hueB, sat, 1.0));
  gl_FragColor = vec4(mix(a, b, l), 1.0);
}`,
  },
  {
    id: 'thermal',
    name: 'Thermal',
    category: 'color',
    description: 'Heat-camera vision: cold blues to white-hot highlights.',
    params: [
      { key: 'contrast', label: 'Contrast', min: 0.5, max: 3, step: 0.01, value: 1.3 },
      { key: 'shift', label: 'Heat shift', min: -0.5, max: 0.5, step: 0.01, value: 0 },
    ],
    frag: LUMA + `
void main() {
  float t = luma(texture2D(u_tex, v_uv).rgb);
  t = clamp((t - 0.5) * contrast + 0.5 + shift, 0.0, 1.0);
  vec3 c = vec3(
    clamp(t * 3.0, 0.0, 1.0),
    clamp(t * 3.0 - 1.0, 0.0, 1.0),
    clamp(t * 3.0 - 2.0, 0.0, 1.0)
  );
  c.b += (1.0 - t) * 0.25;
  gl_FragColor = vec4(c, 1.0);
}`,
  },
  {
    id: 'posterize',
    name: 'Posterize',
    category: 'color',
    description: 'Crush colors into flat bands for a bold poster look.',
    params: [
      { key: 'levels', label: 'Levels', min: 2, max: 16, step: 1, value: 5 },
      { key: 'boost', label: 'Saturation boost', min: 0, max: 1, step: 0.01, value: 0.3 },
    ],
    frag: LUMA + `
void main() {
  vec3 c = texture2D(u_tex, v_uv).rgb;
  c = mix(vec3(luma(c)), c, 1.0 + boost);
  c = floor(c * levels) / (levels - 1.0);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
  },
  {
    id: 'solarize',
    name: 'Solarize',
    category: 'color',
    description: 'Invert tones above a threshold for a surreal darkroom effect.',
    params: [
      { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01, value: 0.5 },
      { key: 'softness', label: 'Softness', min: 0.01, max: 0.5, step: 0.01, value: 0.1 },
    ],
    frag: LUMA + `
void main() {
  vec3 c = texture2D(u_tex, v_uv).rgb;
  float l = luma(c);
  float m = smoothstep(threshold - softness, threshold + softness, l);
  gl_FragColor = vec4(mix(c, 1.0 - c, m), 1.0);
}`,
  },
  {
    id: 'bloom-crush',
    name: 'Bloom Crush',
    category: 'color',
    description: 'Crushed blacks with blooming highlights and haze.',
    params: [
      { key: 'crush', label: 'Black crush', min: 0, max: 0.5, step: 0.01, value: 0.15 },
      { key: 'bloom', label: 'Bloom', min: 0, max: 2, step: 0.01, value: 0.8 },
      { key: 'spread', label: 'Spread', min: 1, max: 8, step: 0.1, value: 3 },
    ],
    frag: LUMA + `
void main() {
  vec2 px = spread / u_res;
  vec3 blur = vec3(0.0);
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      blur += texture2D(u_tex, v_uv + px * vec2(float(x), float(y))).rgb;
    }
  }
  blur /= 25.0;
  vec3 c = texture2D(u_tex, v_uv).rgb;
  c = clamp((c - crush) / (1.0 - crush), 0.0, 1.0);
  vec3 glow = max(blur - 0.5, 0.0) * 2.0 * bloom;
  c = 1.0 - (1.0 - c) * (1.0 - glow);
  gl_FragColor = vec4(c, 1.0);
}`,
  },

  // ---------------- RETRO ----------------
  {
    id: 'halftone',
    name: 'Halftone',
    category: 'retro',
    description: 'Newspaper-style dot printing at any angle.',
    params: [
      { key: 'scale', label: 'Dot size', min: 3, max: 30, step: 0.5, value: 9 },
      { key: 'angle', label: 'Angle', min: 0, max: 1.57, step: 0.01, value: 0.4 },
      { key: 'colorize', label: 'Keep color', min: 0, max: 1, step: 0.01, value: 0 },
    ],
    frag: LUMA + `
void main() {
  float s = sin(angle);
  float c = cos(angle);
  vec2 p = v_uv * u_res;
  vec2 rp = mat2(c, -s, s, c) * p;
  vec2 cell = floor(rp / scale) * scale + scale * 0.5;
  vec2 sp = mat2(c, s, -s, c) * cell / u_res;
  vec3 src = texture2D(u_tex, clamp(sp, 0.0, 1.0)).rgb;
  float l = luma(src);
  float radius = scale * 0.65 * (1.0 - l);
  float d = length(rp - cell);
  float dotMask = smoothstep(radius, radius - 1.2, d);
  vec3 mono = vec3(1.0 - dotMask);
  vec3 col = mix(vec3(1.0), src, dotMask);
  gl_FragColor = vec4(mix(mono, col, colorize), 1.0);
}`,
  },
  {
    id: 'dither',
    name: 'Dither',
    category: 'retro',
    description: 'Ordered 1-bit dithering, like early computer graphics.',
    params: [
      { key: 'pixelSize', label: 'Pixel size', min: 1, max: 8, step: 1, value: 2 },
      { key: 'levels', label: 'Levels', min: 2, max: 8, step: 1, value: 2 },
    ],
    frag: LUMA + `
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
void main() {
  vec2 p = floor(v_uv * u_res / pixelSize);
  vec2 uv = p * pixelSize / u_res;
  float l = luma(texture2D(u_tex, uv).rgb);
  float b = bayer2(0.5 * p) * 0.25 + bayer2(p);
  b /= 1.25;
  float q = floor(l * (levels - 1.0) + b) / (levels - 1.0);
  gl_FragColor = vec4(vec3(clamp(q, 0.0, 1.0)), 1.0);
}`,
  },
  {
    id: 'film-grain',
    name: 'Film Grain',
    category: 'retro',
    description: 'Warm analog film with grain, vignette and faded tones.',
    params: [
      { key: 'grain', label: 'Grain', min: 0, max: 1, step: 0.01, value: 0.3 },
      { key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.01, value: 0.5 },
      { key: 'warmth', label: 'Warmth', min: 0, max: 1, step: 0.01, value: 0.35 },
    ],
    frag: NOISE + LUMA + `
void main() {
  vec3 c = texture2D(u_tex, v_uv).rgb;
  c = mix(c, vec3(luma(c)), 0.2);
  c += vec3(0.08, 0.03, -0.04) * warmth;
  c = c * 0.92 + 0.04;
  float g = hash(v_uv * u_res + fract(u_time) * 500.0) - 0.5;
  c += g * grain * 0.25;
  float d = length(v_uv - 0.5);
  c *= 1.0 - smoothstep(0.4, 0.85, d) * vignette;
  gl_FragColor = vec4(c, 1.0);
}`,
  },
  {
    id: 'crt',
    name: 'CRT Screen',
    category: 'retro',
    description: 'Curved glass, scanlines and a phosphor mask from an old monitor.',
    params: [
      { key: 'curve', label: 'Curvature', min: 0, max: 0.5, step: 0.01, value: 0.15 },
      { key: 'scan', label: 'Scanlines', min: 0, max: 1, step: 0.01, value: 0.4 },
      { key: 'mask', label: 'RGB mask', min: 0, max: 1, step: 0.01, value: 0.3 },
    ],
    frag: `
void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  p *= 1.0 + curve * dot(p, p) * 0.3;
  vec2 uv = p * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 c = texture2D(u_tex, uv).rgb;
  float sl = 0.5 + 0.5 * sin(uv.y * u_res.y * 3.14159);
  c *= 1.0 - scan * 0.5 * sl;
  float stripe = mod(floor(v_uv.x * u_res.x), 3.0);
  vec3 m = vec3(1.0);
  if (stripe < 1.0) m = vec3(1.0, 1.0 - mask, 1.0 - mask);
  else if (stripe < 2.0) m = vec3(1.0 - mask, 1.0, 1.0 - mask);
  else m = vec3(1.0 - mask, 1.0 - mask, 1.0);
  c *= m;
  c *= 1.15;
  gl_FragColor = vec4(c, 1.0);
}`,
  },

  // ---------------- ETHEREAL ----------------
  {
    id: 'dream-glow',
    name: 'Dream Glow',
    category: 'ethereal',
    description: 'Soft diffusion glow with lifted blacks, like a half-remembered dream.',
    params: [
      { key: 'glow', label: 'Glow', min: 0, max: 2, step: 0.01, value: 1 },
      { key: 'lift', label: 'Black lift', min: 0, max: 0.4, step: 0.01, value: 0.12 },
      { key: 'spread', label: 'Spread', min: 1, max: 10, step: 0.1, value: 4 },
    ],
    frag: `
void main() {
  vec2 px = spread / u_res;
  vec3 blur = vec3(0.0);
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      blur += texture2D(u_tex, v_uv + px * vec2(float(x), float(y))).rgb;
    }
  }
  blur /= 25.0;
  vec3 c = texture2D(u_tex, v_uv).rgb;
  c = 1.0 - (1.0 - c) * (1.0 - blur * glow * 0.5);
  c = c * (1.0 - lift) + lift * vec3(0.55, 0.5, 0.7);
  gl_FragColor = vec4(c, 1.0);
}`,
  },
  {
    id: 'aurora-veil',
    name: 'Aurora Veil',
    category: 'ethereal',
    description: 'Drifting northern-light gradients washing over the frame.',
    params: [
      { key: 'strength', label: 'Strength', min: 0, max: 1, step: 0.01, value: 0.5 },
      { key: 'speed', label: 'Drift speed', min: 0, max: 2, step: 0.01, value: 0.4 },
      { key: 'hueA', label: 'Hue A', min: 0, max: 1, step: 0.01, value: 0.45 },
      { key: 'hueB', label: 'Hue B', min: 0, max: 1, step: 0.01, value: 0.75 },
    ],
    frag: HSV + `
void main() {
  vec3 c = texture2D(u_tex, v_uv).rgb;
  float t = u_time * speed;
  float w = sin(v_uv.x * 3.0 + t) * sin(v_uv.y * 2.2 - t * 0.7) * 0.5 + 0.5;
  float w2 = sin(v_uv.x * 1.7 - t * 0.5 + v_uv.y * 2.5) * 0.5 + 0.5;
  vec3 a = hsv2rgb(vec3(hueA, 0.7, 1.0));
  vec3 b = hsv2rgb(vec3(hueB, 0.7, 1.0));
  vec3 aurora = mix(a, b, w) * (0.4 + 0.6 * w2);
  c = 1.0 - (1.0 - c) * (1.0 - aurora * strength);
  gl_FragColor = vec4(c, 1.0);
}`,
  },
  {
    id: 'chromatic-dream',
    name: 'Chromatic Dream',
    category: 'ethereal',
    description: 'Radial chromatic fringing with a soft hazy bloom.',
    params: [
      { key: 'fringe', label: 'Fringe', min: 0, max: 0.06, step: 0.001, value: 0.015 },
      { key: 'haze', label: 'Haze', min: 0, max: 1, step: 0.01, value: 0.35 },
    ],
    frag: `
void main() {
  vec2 dir = v_uv - 0.5;
  float r = texture2D(u_tex, v_uv + dir * fringe).r;
  float g = texture2D(u_tex, v_uv).g;
  float b = texture2D(u_tex, v_uv - dir * fringe).b;
  vec3 c = vec3(r, g, b);
  vec2 px = 5.0 / u_res;
  vec3 blur = vec3(0.0);
  blur += texture2D(u_tex, v_uv + px * vec2(-1.0, -1.0)).rgb;
  blur += texture2D(u_tex, v_uv + px * vec2(1.0, -1.0)).rgb;
  blur += texture2D(u_tex, v_uv + px * vec2(-1.0, 1.0)).rgb;
  blur += texture2D(u_tex, v_uv + px * vec2(1.0, 1.0)).rgb;
  blur *= 0.25;
  c = mix(c, max(c, blur + 0.1), haze);
  gl_FragColor = vec4(c, 1.0);
}`,
  },
  {
    id: 'pastel-wash',
    name: 'Pastel Wash',
    category: 'ethereal',
    description: 'Lifted, desaturated pastel grade with a gentle color tint.',
    params: [
      { key: 'wash', label: 'Wash', min: 0, max: 1, step: 0.01, value: 0.45 },
      { key: 'tintHue', label: 'Tint hue', min: 0, max: 1, step: 0.01, value: 0.85 },
      { key: 'brightness', label: 'Brightness', min: 0.8, max: 1.5, step: 0.01, value: 1.1 },
    ],
    frag: HSV + LUMA + `
void main() {
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 tint = hsv2rgb(vec3(tintHue, 0.25, 1.0));
  c = mix(c, vec3(luma(c)), wash * 0.6);
  c = c * brightness;
  c = mix(c, 1.0 - (1.0 - c) * (1.0 - tint * 0.4), wash);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
  },
];

export const byId = Object.fromEntries(EFFECTS.map((e) => [e.id, e]));
export const byCategory = (catId) => EFFECTS.filter((e) => e.category === catId);
export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
