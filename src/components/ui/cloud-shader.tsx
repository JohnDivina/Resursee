'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CloudShaderProps {
  className?: string;
  speed?: number;
}

export function CloudShader({ className = '', speed = 1.0 }: CloudShaderProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try WebGL first
    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        (canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        }) as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }

    let animId: number;
    let cleanup = () => {};

    if (gl) {
      cleanup = initWebGLShader(gl, canvas, speed);
    } else {
      cleanup = init2DCloudFallback(canvas, speed);
    }

    return () => {
      cleanup();
    };
  }, [mounted, speed]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

// -------------------------------------------------------------
// 1. WebGL Procedural Volumetric Cloud Shader (Strict GLSL 1.00)
// -------------------------------------------------------------
function initWebGLShader(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  speed: number
) {
  const vsSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    // 2D Hash
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // 2D Smooth Value Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      float a = hash(i + vec2(0.0, 0.0));
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // 5-Octave Fractional Brownian Motion (Strictly conformant)
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 2.0 + vec2(1.2, 3.4);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

      float t = u_time * 0.18;

      // Mouse interactivity
      vec2 mouseDist = (u_mouse - 0.5) * 2.0;
      p += mouseDist * 0.12 / (length(p - mouseDist) + 0.8);

      // Multi-layer domain warping for dynamic cloud eddies
      vec2 q = vec2(
        fbm(p + vec2(0.0, t * 0.4)),
        fbm(p + vec2(5.2, 1.3 - t * 0.3))
      );

      vec2 r = vec2(
        fbm(p + 3.0 * q + vec2(1.7 - t * 0.2, 9.2)),
        fbm(p + 3.0 * q + vec2(8.3, 2.8 + t * 0.2))
      );

      float f = fbm(p + 4.0 * r);

      // Vivid Cloud Palette:
      // Navy Blue, Resursee Royal Blue (#2563eb), Bright Cyan (#06b6d4), Radiant White
      vec3 colNavy = vec3(0.06, 0.12, 0.26);
      vec3 colRoyal = vec3(0.14, 0.38, 0.92);
      vec3 colCyan = vec3(0.12, 0.72, 0.96);
      vec3 colWhite = vec3(0.95, 0.98, 1.0);

      vec3 color = mix(colNavy, colRoyal, clamp((f * f) * 3.5, 0.0, 1.0));
      color = mix(color, colCyan, clamp(length(q), 0.0, 1.0));
      color = mix(color, colWhite, clamp(pow(length(r.x), 2.5), 0.0, 1.0));

      // Luminous crests
      float crest = smoothstep(0.45, 0.85, f);
      color += crest * 0.3 * vec3(0.5, 0.8, 1.0);

      // Soft vignette
      float edgeFade = smoothstep(0.0, 0.15, st.y) * smoothstep(1.0, 0.85, st.y);
      gl_FragColor = vec4(color, clamp(edgeFade * 0.95 + 0.05, 0.0, 1.0));
    }
  `;

  function compileShader(type: number, src: string) {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return init2DCloudFallback(canvas, speed);

  const prog = gl.createProgram();
  if (!prog) return init2DCloudFallback(canvas, speed);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    return init2DCloudFallback(canvas, speed);
  }
  gl.useProgram(prog);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]),
    gl.STATIC_DRAW
  );

  const posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  let animId: number;
  const startTime = performance.now();

  function resize() {
    if (!canvas || !gl) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(Math.floor(rect.width * dpr), 300);
    const height = Math.max(Math.floor(rect.height * dpr), 300);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let mouseX = 0.5;
  let mouseY = 0.5;

  const onMouseMove = (e: MouseEvent) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
  };

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  function render() {
    if (!gl || !canvas) return;
    const now = (performance.now() - startTime) * 0.001 * speed;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, now);
    gl.uniform2f(uMouse, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    animId = requestAnimationFrame(render);
  }

  render();

  return () => {
    cancelAnimationFrame(animId);
    observer.disconnect();
    window.removeEventListener('mousemove', onMouseMove);
  };
}

// -------------------------------------------------------------
// 2. High-Definition 2D Canvas Procedural Volumetric Cloud Fallback
// -------------------------------------------------------------
function init2DCloudFallback(canvas: HTMLCanvasElement, speed: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let animId: number;
  let time = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(Math.floor(rect.width * dpr), 300);
    canvas.height = Math.max(Math.floor(rect.height * dpr), 300);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  // Floating volumetric cloud puffs
  const puffs = Array.from({ length: 24 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    radius: 120 + Math.random() * 180,
    vx: (Math.random() - 0.5) * 0.0008,
    vy: (Math.random() - 0.5) * 0.0005,
    hue: 215 + Math.random() * 35, // Blues & Cyans
  }));

  function render() {
    if (!ctx || !canvas) return;
    time += 0.01 * speed;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ambient Deep Navy Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0a192f');
    bgGrad.addColorStop(0.5, '#1e3a8a');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw volumetric cloud eddies
    puffs.forEach((puff, idx) => {
      puff.x += puff.vx * speed;
      puff.y += puff.vy * speed;
      if (puff.x < -0.2) puff.x = 1.2;
      if (puff.x > 1.2) puff.x = -0.2;
      if (puff.y < -0.2) puff.y = 1.2;
      if (puff.y > 1.2) puff.y = -0.2;

      const px = puff.x * canvas.width;
      const py = puff.y * canvas.height;
      const r = puff.radius * (canvas.width / 1000);

      const radGrad = ctx.createRadialGradient(px, py, 0, px, py, r);
      radGrad.addColorStop(0, `hsla(${puff.hue}, 85%, 65%, 0.45)`);
      radGrad.addColorStop(0.4, `hsla(${puff.hue}, 80%, 50%, 0.25)`);
      radGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });

    animId = requestAnimationFrame(render);
  }

  render();

  return () => {
    cancelAnimationFrame(animId);
    observer.disconnect();
  };
}
