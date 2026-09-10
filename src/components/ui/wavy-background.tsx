'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { createNoise3D } from 'simplex-noise';
import { useTheme } from '@/components/theme/ThemeProvider';

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  darkColors,
  waveWidth,
  backgroundFill = 'transparent',
  blur = 8,
  speed = 'fast',
  waveOpacity = 0.45,
  darkWaveOpacity = 0.30,
  isFixed = false,
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  darkColors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: 'slow' | 'fast' | number;
  waveOpacity?: number;
  darkWaveOpacity?: number;
  isFixed?: boolean;
  [key: string]: any;
}) => {
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

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
    if (typeof speed === 'number') return speed;
    switch (speed) {
      case 'slow':
        return 0.0015;
      case 'fast':
        return 0.0035;
      default:
        return 0.0025;
    }
  };

  // Curated Light Mode Blue Palette
  const defaultLightWaveColors = [
    '#2563eb', // Royal Blue
    '#38bdf8', // Sky Blue
    '#1d4ed8', // Deep Cobalt
    '#0284c7', // Vivid Cyan
    '#60a5fa', // Soft Blue
  ];

  // Curated Dark Mode White Palette (clean, ethereal, luminous white waves)
  const defaultDarkWaveColors = [
    '#ffffff',
    'rgba(255, 255, 255, 0.95)',
    'rgba(240, 240, 240, 0.85)',
    'rgba(255, 255, 255, 0.70)',
    'rgba(230, 230, 230, 0.90)',
  ];

  const getWaveColors = () => {
    const isDark =
      themeRef.current === 'dark' ||
      (typeof document !== 'undefined' &&
        (document.documentElement.getAttribute('data-theme') === 'dark' ||
          document.documentElement.classList.contains('dark')));
    return isDark
      ? (darkColors ?? defaultDarkWaveColors)
      : (colors ?? defaultLightWaveColors);
  };

  const getWaveOpacity = () => {
    const isDark =
      themeRef.current === 'dark' ||
      (typeof document !== 'undefined' &&
        (document.documentElement.getAttribute('data-theme') === 'dark' ||
          document.documentElement.classList.contains('dark')));
    return isDark ? (darkWaveOpacity ?? 0.30) : (waveOpacity || 0.45);
  };

  const init = () => {
    canvas = canvasRef.current;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = isFixed ? null : (containerRef.current || canvas.parentElement);
    w = ctx.canvas.width = parent ? parent.offsetWidth : window.innerWidth;
    h = ctx.canvas.height = parent ? parent.offsetHeight : window.innerHeight;
    nt = 0;

    const handleResize = () => {
      if (!ctx || !canvas) return;
      const p = isFixed ? null : (containerRef.current || canvas.parentElement);
      w = ctx.canvas.width = p ? p.offsetWidth : window.innerWidth;
      h = ctx.canvas.height = p ? p.offsetHeight : window.innerHeight;
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
    const currentColors = getWaveColors();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.lineWidth = waveWidth || 45;
      ctx.strokeStyle = currentColors[i % currentColors.length];
      for (x = 0; x < w; x += 12) {
        const y = noise(x / 800, 0.3 * i, nt) * 90;
        ctx.lineTo(x, y + h * 0.5);
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
    ctx.globalAlpha = getWaveOpacity();
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    const cleanup = init();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        render();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full flex flex-col',
        containerClassName
      )}
    >
      <canvas
        className={cn(
          'pointer-events-none z-0',
          isFixed
            ? 'fixed inset-0 h-screen w-screen'
            : 'absolute inset-0 h-full w-full'
        )}
        ref={canvasRef}
        id="canvas"
        style={{
          filter: `blur(${blur}px)`,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
        }}
      />
      {children && (
        <div className={cn('relative z-10 w-full flex-1 flex flex-col', className)} {...props}>
          {children}
        </div>
      )}
    </div>
  );
};
