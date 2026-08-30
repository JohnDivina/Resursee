'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
}

interface InteractiveParticlesProps {
  className?: string;
  style?: React.CSSProperties;
  particleCount?: number;
  connectionDistance?: number;
  mouseRadius?: number;
  accentMode?: 'cobalt' | 'amber' | 'mixed';
}

export default function InteractiveParticles({
  className = '',
  style,
  particleCount = 55,
  connectionDistance = 135,
  mouseRadius = 140,
  accentMode = 'mixed',
}: InteractiveParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const mouse = {
      x: -9999,
      y: -9999,
      isActive: false,
    };

    // Rich vibrant palette for strong visibility in both light & dark modes
    const colorPalette = [
      { fill: 'rgba(37, 99, 235,', glow: 'rgba(37, 99, 235, 0.7)' },   // Electric Royal Blue
      { fill: 'rgba(2, 132, 199,', glow: 'rgba(2, 132, 199, 0.7)' },   // Cerulean Sky
      { fill: 'rgba(13, 148, 136,', glow: 'rgba(13, 148, 136, 0.65)' }, // Aquamarine Cyan
      { fill: 'rgba(217, 119, 6,', glow: 'rgba(217, 119, 6, 0.75)' },   // Amber Gold
      { fill: 'rgba(124, 58, 237,', glow: 'rgba(124, 58, 237, 0.7)' },  // Electric Indigo
    ];

    const actualCount = width < 768 ? Math.floor(particleCount * 0.5) : particleCount;

    const particles: Particle[] = [];
    for (let i = 0; i < actualCount; i++) {
      const palette = colorPalette[i % colorPalette.length];
      const baseAlpha = Math.random() * 0.35 + 0.45; // 0.45 - 0.80 for clear visibility
      const x = Math.random() * width;
      const y = Math.random() * height;

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 1.8 + 2.2, // 2.2px - 4.0px
        color: palette.fill,
        glowColor: palette.glow,
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: 0.015 + Math.random() * 0.02,
      });
    }

    const updateDimensions = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      canvas.style.position = 'fixed';
      canvas.style.left = '0px';
      canvas.style.top = '0px';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    updateDimensions();

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = -9999;
      let clientY = -9999;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      mouse.x = clientX;
      mouse.y = clientY;
      mouse.isActive = true;
    };

    const handlePointerLeave = () => {
      mouse.isActive = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchend', handlePointerLeave);

    // High-performance 60fps render loop
    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Active Magnetic Cursor Target Anchor
      if (mouse.isActive && mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.85)';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(37, 99, 235, 1)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 2. Update & Draw Constellation Nodes & Connecting Rays
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic harmonic breathing pulse
        p.alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed * 60 + i) * 0.15;

        // Position update
        p.x += p.vx;
        p.y += p.vy;

        // Soft elastic screen bounds bounce
        if (p.x <= 0) { p.x = 0; p.vx *= -1; }
        if (p.x >= width) { p.x = width; p.vx *= -1; }
        if (p.y <= 0) { p.y = 0; p.vy *= -1; }
        if (p.y >= height) { p.y = height; p.vy *= -1; }

        // Interactive Cursor Magnetic Attraction & Laser Beam Lines
        if (mouse.isActive && mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouseRadius) {
            const lineAlpha = (1 - dist / mouseRadius) * 0.65;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${lineAlpha})`;
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Subtle cursor gravity pull
            p.x += (dx / dist) * 0.4;
            p.y += (dy / dist) * 0.4;
          }
        }

        // Draw glowing particle star
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${Math.max(0.2, p.alpha)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.glowColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect Nearby Constellation Stars (Node to Node mesh)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (dist < connectionDistance) {
            const lineAlpha = (1 - dist / connectionDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
    };
  }, [particleCount, connectionDistance, mouseRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-screen h-screen pointer-events-none z-0 ${className}`}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        margin: 0,
        padding: 0,
        ...style,
      }}
    />
  );
}
