const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const HEADER = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_time;
uniform vec2 u_res;
`;

export const PREVIEW_DIM = 1280;
export const EXPORT_DIM = 1920;
export const PHOTO_EXPORT_DIM = 4096;

export class GLRenderer {
  constructor(canvas, maxDim = PREVIEW_DIM) {
    this.canvas = canvas;
    this.maxDim = maxDim;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.cache = new Map();
    this.lastUpload = null;
  }

  compile(effect) {
    const gl = this.gl;
    if (this.cache.has(effect.id)) return this.cache.get(effect.id);

    const paramDecls = effect.params.map((p) => `uniform float ${p.key};`).join('\n');
    const fragSrc = HEADER + paramDecls + '\n' + effect.frag;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERT);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      throw new Error(`Shader "${effect.id}": ${gl.getShaderInfoLog(fs)}`);
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    const uniforms = {
      u_tex: gl.getUniformLocation(prog, 'u_tex'),
      u_time: gl.getUniformLocation(prog, 'u_time'),
      u_res: gl.getUniformLocation(prog, 'u_res'),
    };
    for (const p of effect.params) {
      uniforms[p.key] = gl.getUniformLocation(prog, p.key);
    }
    const aPos = gl.getAttribLocation(prog, 'a_pos');

    const entry = { prog, uniforms, aPos };
    this.cache.set(effect.id, entry);
    return entry;
  }

  setEffect(effect) {
    this.effect = effect;
    this.compiled = this.compile(effect);
  }

  setMaxDim(n) {
    this.maxDim = n;
  }

  sourceSize(source) {
    let w = source.videoWidth || source.naturalWidth || source.width;
    let h = source.videoHeight || source.naturalHeight || source.height;
    if (Math.max(w, h) > this.maxDim) {
      const s = this.maxDim / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    return [w, h];
  }

  draw(source, params, time) {
    const gl = this.gl;
    if (!this.compiled || !source) return;
    const [w, h] = this.sourceSize(source);
    if (!w || !h) return;

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);

    const { prog, uniforms, aPos } = this.compiled;
    gl.useProgram(prog);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    // Static images only need uploading once; videos change every frame
    const isVideo = source.tagName === 'VIDEO';
    if (isVideo || this.lastUpload !== source) {
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        this.lastUpload = source;
      } catch {
        return;
      }
    }

    gl.uniform1i(uniforms.u_tex, 0);
    gl.uniform1f(uniforms.u_time, time);
    gl.uniform2f(uniforms.u_res, w, h);
    for (const p of this.effect.params) {
      gl.uniform1f(uniforms[p.key], params[p.key] ?? p.value);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
