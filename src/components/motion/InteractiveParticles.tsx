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
  className,
  style,
  particleCount = 48,
  connectionDistance = 110,
  mouseRadius = 100,
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

    // Color palette: Resursee Cobalt Blue, Sky Sapphire & Academic Amber
    const cobaltPalette = [
      { fill: 'rgba(37, 99, 235, ', glow: 'rgba(37, 99, 235, 0.45)' }, // Electric Cobalt
      { fill: 'rgba(14, 165, 233, ', glow: 'rgba(14, 165, 233, 0.40)' }, // Sapphire Cyan
      { fill: 'rgba(99, 102, 241, ', glow: 'rgba(99, 102, 241, 0.35)' }, // Academic Indigo
    ];

    const mixedPalette = [
      { fill: 'rgba(37, 99, 235, ', glow: 'rgba(37, 99, 235, 0.45)' },
      { fill: 'rgba(14, 165, 233, ', glow: 'rgba(14, 165, 233, 0.40)' },
      { fill: 'rgba(245, 158, 11, ', glow: 'rgba(245, 158, 11, 0.40)' }, // Amber Star
    ];

    const colors = accentMode === 'cobalt' ? cobaltPalette : mixedPalette;

    const actualCount = width < 768 ? Math.floor(particleCount * 0.45) : particleCount;

    const particles: Particle[] = [];
    for (let i = 0; i < actualCount; i++) {
      const palette = colors[Math.floor(Math.random() * colors.length)];
      const baseAlpha = Math.random() * 0.35 + 0.20;
      const x = Math.random() * width;
      const y = Math.random() * height;

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.6 + 1.2,
        color: palette.fill,
        glowColor: palette.glow,
        alpha: baseAlpha,
        baseAlpha,
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
      canvas.style.margin = '0px';
      canvas.style.padding = '0px';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    updateDimensions();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
        mouse.isActive = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.isActive = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Animation Loop
    let time = 0;
    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Draw Cursor Focus Anchor when active
      if (mouse.isActive && mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.75)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(37, 99, 235, 0.9)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic subtle floating pulse
        p.alpha = p.baseAlpha + Math.sin(time + i * 0.6) * 0.10;

        // Smooth independent drift
        p.x += p.vx;
        p.y += p.vy;

        // Smooth boundary bounce
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > height) { p.y = height; p.vy *= -1; }

        // Connect Cursor to Nearby Particles (Magnetic lines)
        if (mouse.isActive && mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouseRadius) {
            const lineAlpha = (1 - dist / mouseRadius) * 0.42;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${lineAlpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.08, p.alpha)})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.glowColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect Nearby Particles (Constellation mesh)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (dist < connectionDistance) {
            const lineAlpha = (1 - dist / connectionDistance) * 0.14;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
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
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [particleCount, connectionDistance, mouseRadius, accentMode]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
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
