'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CloudShaderProps {
  className?: string;
  speed?: number;
}

export function CloudShader({ className = '', speed = 0.8 }: CloudShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        canvas.getContext('webgl', {
          alpha: false,
          antialias: false,
          depth: false,
        }) ||
        (canvas.getContext('experimental-webgl', {
          alpha: false,
          antialias: false,
        }) as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }

    if (!gl) {
      return render2DSkyClouds(canvas, speed);
    }

    // Vertex Shader
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Bright Sunny Sky & Fluffy White Clouds
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      // 2D Hash
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      // Smooth Gradient Value Noise
      float gnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
              dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
          mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
              dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      // 5-Octave Fractional Brownian Motion (Billowing Cloud Shapes)
      float fbm(vec2 p) {
        float f = 0.0;
        f += 0.5000 * gnoise(p); p = p * 2.02 + vec2(1.7, 3.2);
        f += 0.2500 * gnoise(p); p = p * 2.03 + vec2(8.3, 1.8);
        f += 0.1250 * gnoise(p); p = p * 2.01 + vec2(4.1, 7.5);
        f += 0.0625 * gnoise(p); p = p * 2.04 + vec2(2.9, 5.3);
        f += 0.0312 * gnoise(p);
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        float time = u_time * 0.08;

        // Interactive mouse distortion wave
        vec2 mouse = (u_mouse - 0.5) * 1.5;
        p += mouse * 0.08 / (length(p - mouse) + 0.8);

        // Fluid Multi-Layer Domain Warping for organic billowing cumulus clouds
        vec2 q = vec2(
          fbm(p + vec2(time * 0.4, time * 0.15)),
          fbm(p + vec2(5.2 + time * 0.25, 1.3 - time * 0.2))
        );

        vec2 r = vec2(
          fbm(p + 3.0 * q + vec2(1.7 - time * 0.1, 9.2 + time * 0.12)),
          fbm(p + 3.0 * q + vec2(8.3 + time * 0.15, 2.8 - time * 0.1))
        );

        float f = fbm(p + 3.5 * r);

        // Vibrant Sky Colors: Deep Sky Blue to Azure Cerulean
        vec3 skyTop = vec3(0.08, 0.42, 0.88);
        vec3 skyMid = vec3(0.24, 0.62, 0.96);
        vec3 skyHorizon = vec3(0.55, 0.82, 0.99);

        // Sky Vertical Gradient
        vec3 skyColor = mix(skyHorizon, skyMid, clamp(uv.y * 1.2, 0.0, 1.0));
        skyColor = mix(skyColor, skyTop, clamp((uv.y - 0.3) * 1.4, 0.0, 1.0));

        // Billowing Cloud Colors
        vec3 cloudHighlight = vec3(1.0, 1.0, 1.0);
        vec3 cloudBody = vec3(0.96, 0.98, 1.0);
        vec3 cloudShadow = vec3(0.78, 0.88, 0.98);

        // Cloud Density thresholding
        float cloudCover = smoothstep(-0.15, 0.65, f);
        float cloudPuff = smoothstep(0.1, 0.85, f);

        vec3 cloudColor = mix(cloudShadow, cloudBody, clamp(cloudCover * 1.2, 0.0, 1.0));
        cloudColor = mix(cloudColor, cloudHighlight, clamp(pow(cloudPuff, 2.0) * 1.4, 0.0, 1.0));

        // Blend Clouds onto Sunny Blue Sky
        float cloudAlpha = smoothstep(-0.1, 0.55, f);
        vec3 finalColor = mix(skyColor, cloudColor, clamp(cloudAlpha * 0.92, 0.0, 1.0));

        // Sunlit rim lighting
        float rim = smoothstep(0.4, 0.8, f) * (1.0 - smoothstep(0.8, 0.95, f));
        finalColor += rim * 0.15 * vec3(1.0, 0.98, 0.92);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return render2DSkyClouds(canvas, speed);

    const prog = gl.createProgram();
    if (!prog) return render2DSkyClouds(canvas, speed);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return render2DSkyClouds(canvas, speed);
    }
    gl.useProgram(prog);

    // Quad Buffer
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(Math.floor(rect.width * dpr), 400);
      const h = Math.max(Math.floor(rect.height * dpr), 300);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
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
  }, [mounted, speed]);

  return (
    <div className={`fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none -z-10 ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full block"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}

// -------------------------------------------------------------
// 2D Canvas Procedural Sunny Blue Sky & Cloud Fallback
// -------------------------------------------------------------
function render2DSkyClouds(canvas: HTMLCanvasElement, speed: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let animId: number;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(Math.floor(rect.width * dpr), 400);
    canvas.height = Math.max(Math.floor(rect.height * dpr), 300);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const puffs = Array.from({ length: 30 }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: 160 + Math.random() * 220,
    vx: 0.0002 + Math.random() * 0.0003,
    vy: (Math.random() - 0.5) * 0.0001,
  }));

  function loop() {
    if (!ctx || !canvas) return;

    // Sunny Sky Gradient
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#1565c0');
    bg.addColorStop(0.5, '#42a5f5');
    bg.addColorStop(1, '#bbdefb');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw fluffy white clouds
    puffs.forEach((puff) => {
      puff.x += puff.vx * speed;
      puff.y += puff.vy * speed;
      if (puff.x > 1.3) puff.x = -0.3;
      if (puff.y < -0.2) puff.y = 1.2;
      if (puff.y > 1.2) puff.y = -0.2;

      const px = puff.x * canvas.width;
      const py = puff.y * canvas.height;
      const r = puff.radius * (canvas.width / 1000);

      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });

    animId = requestAnimationFrame(loop);
  }

  loop();

  return () => {
    cancelAnimationFrame(animId);
    observer.disconnect();
  };
}
