'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { createNoise3D } from 'simplex-noise';

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill = 'transparent',
  blur = 8,
  speed = 'fast',
  waveOpacity = 0.45,
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: 'slow' | 'fast';
  waveOpacity?: number;
  [key: string]: any;
}) => {
  const noise = createNoise3D();
  let w: number,
    h: number,
    nt: number,
    i: number,
    x: number,
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSpeed = () => {
    switch (speed) {
      case 'slow':
        return 0.001;
      case 'fast':
        return 0.002;
      default:
        return 0.0015;
    }
  };

  // Curated Shades of Blue Palette
  const waveColors = colors ?? [
    '#2563eb', // Royal Blue
    '#38bdf8', // Sky Blue
    '#1d4ed8', // Deep Cobalt
    '#0284c7', // Vivid Cyan
    '#60a5fa', // Soft Blue
  ];

  const init = () => {
    canvas = canvasRef.current;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = containerRef.current || canvas.parentElement;
    w = ctx.canvas.width = parent ? parent.offsetWidth : window.innerWidth;
    h = ctx.canvas.height = parent ? parent.offsetHeight : window.innerHeight;
    ctx.filter = `blur(${blur}px)`;
    nt = 0;

    const handleResize = () => {
      if (!ctx || !canvas) return;
      const p = containerRef.current || canvas.parentElement;
      w = ctx.canvas.width = p ? p.offsetWidth : window.innerWidth;
      h = ctx.canvas.height = p ? p.offsetHeight : window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const drawWave = (n: number) => {
    if (!ctx) return;
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.lineWidth = waveWidth || 45;
      ctx.strokeStyle = waveColors[i % waveColors.length];
      for (x = 0; x < w; x += 5) {
        const y = noise(x / 800, 0.3 * i, nt) * 85;
        ctx.lineTo(x, y + h * 0.45);
      }
      ctx.stroke();
      ctx.closePath();
    }
  };

  let animationId: number;
  const render = () => {
    if (!ctx) return;
    if (backgroundFill === 'transparent') {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = backgroundFill;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = waveOpacity || 0.45;
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    const cleanup = init();
    return () => {
      cancelAnimationFrame(animationId);
      if (cleanup) cleanup();
    };
  }, []);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(
      typeof window !== 'undefined' &&
        navigator.userAgent.includes('Safari') &&
        !navigator.userAgent.includes('Chrome')
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full flex flex-col items-center justify-center overflow-hidden',
        containerClassName
      )}
    >
      <canvas
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      />
      <div className={cn('relative z-10 w-full', className)} {...props}>
        {children}
      </div>
    </div>
  );
};
