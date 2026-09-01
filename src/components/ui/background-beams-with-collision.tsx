'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  gravity: number;
  life: number;
  maxLife: number;
}

interface Flash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface Beam {
  x: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  targetY: number;
  alpha: number;
  trailColor: string;
  headColor: string;
  glowColor: string;
  spawnDelay: number;
}

export function BackgroundBeamsWithCollision({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // Curated Blue-Only Accent Color Palette
    const bluePalettes = [
      {
        trail: 'rgba(37, 99, 235,', // Electric Royal Blue
        head: '#60a5fa',
        glow: 'rgba(37, 99, 235, 0.9)',
      },
      {
        trail: 'rgba(2, 132, 199,', // Sky Blue
        head: '#38bdf8',
        glow: 'rgba(2, 132, 199, 0.9)',
      },
      {
        trail: 'rgba(29, 78, 216,', // Deep Cobalt
        head: '#93c5fd',
        glow: 'rgba(29, 78, 216, 0.85)',
      },
      {
        trail: 'rgba(79, 70, 229,', // Indigo Blue
        head: '#a5b4fc',
        glow: 'rgba(79, 70, 229, 0.85)',
      },
    ];

    const beamCount = width < 768 ? 7 : 14;
    const beams: Beam[] = [];
    const sparks: Spark[] = [];
    const flashes: Flash[] = [];

    // Initialize laser beams evenly spaced across the screen
    for (let i = 0; i < beamCount; i++) {
      const p = bluePalettes[i % bluePalettes.length];
      const sectionWidth = width / beamCount;
      const x = sectionWidth * i + Math.random() * (sectionWidth * 0.7);
      const length = Math.random() * 70 + 60; // 60px - 130px beam length
      const speed = Math.random() * 4.5 + 4.0; // 4.0px - 8.5px/frame
      const targetY = height - (Math.random() * 60 + 20); // Collide near screen floor

      beams.push({
        x,
        y: -length - Math.random() * height * 0.8,
        length,
        speed,
        width: Math.random() * 1.2 + 1.2,
        targetY,
        alpha: Math.random() * 0.35 + 0.65,
        trailColor: p.trail,
        headColor: p.head,
        glowColor: p.glow,
        spawnDelay: Math.random() * 40,
      });
    }

    // Trigger explosive collision particle sparks
    const createExplosion = (x: number, y: number, color: string) => {
      // 1. Horizontal impact light flash
      flashes.push({
        x,
        y,
        radius: 4,
        maxRadius: Math.random() * 24 + 18,
        alpha: 1.0,
      });

      // 2. High-energy explosive sparks
      const sparkCount = Math.floor(Math.random() * 10 + 20); // 20 - 30 sparks
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.random() * Math.PI * 0.9) + (Math.PI * 1.05); // Upward arc
        const velocity = Math.random() * 5.5 + 2.0;
        const maxLife = Math.floor(Math.random() * 28 + 24);

        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * velocity + (Math.random() * 2 - 1),
          vy: Math.sin(angle) * velocity,
          alpha: 1.0,
          size: Math.random() * 2.2 + 1.2,
          color: Math.random() > 0.4 ? '#38bdf8' : '#60a5fa',
          gravity: 0.18,
          life: 0,
          maxLife,
        });
      }
    };

    // Main animation render loop (60 FPS)
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update and draw beams
      for (let i = 0; i < beams.length; i++) {
        const b = beams[i];

        if (b.spawnDelay > 0) {
          b.spawnDelay--;
          continue;
        }

        b.y += b.speed;

        // Check if beam hit the floor target
        if (b.y >= b.targetY) {
          createExplosion(b.x, b.targetY, b.headColor);

          // Reset beam above top with new randomized trajectory & floor target
          b.y = -b.length - (Math.random() * 250);
          b.x = Math.random() * (width - 40) + 20;
          b.speed = Math.random() * 4.5 + 4.0;
          b.length = Math.random() * 70 + 60;
          b.targetY = height - (Math.random() * 60 + 20);
          b.spawnDelay = Math.random() * 25;
          continue;
        }

        // Draw laser beam streak
        const beamEndY = b.y;
        const beamStartY = Math.max(-50, b.y - b.length);

        if (beamEndY > 0) {
          const gradient = ctx.createLinearGradient(b.x, beamStartY, b.x, beamEndY);
          gradient.addColorStop(0, `${b.trailColor} 0)`);
          gradient.addColorStop(0.7, `${b.trailColor} ${b.alpha * 0.7})`);
          gradient.addColorStop(1, `${b.trailColor} ${b.alpha})`);

          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = b.width;
          ctx.lineCap = 'round';
          ctx.shadowColor = b.glowColor;
          ctx.shadowBlur = 10;
          ctx.moveTo(b.x, beamStartY);
          ctx.lineTo(b.x, beamEndY);
          ctx.stroke();

          // Intense glowing laser head dot
          ctx.beginPath();
          ctx.arc(b.x, beamEndY, b.width * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = b.headColor;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.restore();
        }
      }

      // 2. Update and draw impact light flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.radius += (f.maxRadius - f.radius) * 0.2;
        f.alpha -= 0.055;

        if (f.alpha <= 0) {
          flashes.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, f.radius, f.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${f.alpha * 0.75})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
      }

      // 3. Update and draw exploding sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.life++;
        s.alpha = 1.0 - s.life / s.maxLife;

        if (s.life >= s.maxLife || s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.alpha, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={cn(
        'relative min-h-screen w-full overflow-hidden bg-transparent flex flex-col',
        className
      )}
    >
      {/* Full-Page Fixed Canvas for continuous laser beams & floor explosions */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 h-full w-full select-none"
        aria-hidden="true"
      />

      {/* Main Page Interactive Content Layer */}
      <div className="relative z-10 flex min-h-screen flex-col flex-1">
        {children}
      </div>
    </div>
  );
}
