'use client';

import React, { useEffect, useRef } from 'react';

interface CloudShaderProps {
  className?: string;
  speed?: number;
  intensity?: number;
}

export function CloudShader({
  className = '',
  speed = 1.0,
  intensity = 1.0,
}: CloudShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Request WebGL with anti-aliasing and no premultiplied alpha for vivid saturation
    const gl =
      canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return;

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // High-definition Volumetric Cloud & Aurora Shader
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      // 2D Rotation matrix
      mat2 rot(float a) {
        float c = cos(a);
        float s = sin(a);
        return mat2(c, -s, s, c);
      }

      // Procedural 2D Simplex Noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                           -0.577350269189626,
                            0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Fractional Brownian Motion (6 Octaves for ultra-crisp cloud definition)
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rotMatrix = rot(0.5);
        for (int i = 0; i < 6; ++i) {
          v += a * snoise(p);
          p = rotMatrix * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        float t = u_time * 0.15;

        // Interactive mouse distortion ripple
        vec2 mouseEffect = (u_mouse - 0.5) * 1.5;
        p += mouseEffect * 0.15 / (length(p - mouseEffect) + 0.6);

        // Fluid Multi-Layer Domain Warping
        vec2 q = vec2(0.0);
        q.x = fbm(p + vec2(0.0, t * 0.5));
        q.y = fbm(p + vec2(1.0, t * 0.3));

        vec2 r = vec2(0.0);
        r.x = fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.2 * t);
        r.y = fbm(p + 3.0 * q + vec2(8.3, 2.8) + 0.15 * t);

        float f = fbm(p + 4.0 * r + vec2(0.0, t * 0.1));

        // Resursee High-Contrast Palette:
        // Deep Indigo/Navy (#0f172a, #1e3a8a), Royal Blue (#2563eb), Vivid Cyan Glow (#06b6d4), Luminous White Mist
        vec3 colorDarkBg = vec3(0.05, 0.09, 0.20);
        vec3 colorDeepBlue = vec3(0.12, 0.32, 0.85);
        vec3 colorCyanMist = vec3(0.15, 0.72, 0.95);
        vec3 colorWhitePeak = vec3(0.92, 0.96, 1.0);

        // Mix dynamic gradient
        vec3 color = mix(colorDarkBg, colorDeepBlue, clamp((f*f)*4.0, 0.0, 1.0));
        color = mix(color, colorCyanMist, clamp(length(q), 0.0, 1.0));
        color = mix(color, colorWhitePeak, clamp(pow(length(r.x), 3.0), 0.0, 1.0));

        // Highlight cloud crests
        float crest = smoothstep(0.4, 0.9, f);
        color += crest * 0.35 * vec3(0.4, 0.7, 1.0);

        // Vignette at bottom edge for seamless blending
        float alpha = smoothstep(0.0, 0.2, st.y) * smoothstep(1.0, 0.8, st.y);
        alpha = clamp(alpha * 0.95 + 0.05, 0.0, 1.0);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    function compileShader(glCtx: WebGLRenderingContext, type: number, src: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, src);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error(glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
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

    function setCanvasDimensions() {
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

    const observer = new ResizeObserver(() => {
      setCanvasDimensions();
    });
    observer.observe(canvas);
    setCanvasDimensions();

    let mouseX = 0.5;
    let mouseY = 0.5;

    const onMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    function loop() {
      if (!gl || !canvas) return;
      const now = (performance.now() - startTime) * 0.001 * speed;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now);
      gl.uniform2f(uMouse, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [speed, intensity]);

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
