'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isTransitioning: false,
});

export const useTheme = () => useContext(ThemeContext);

interface RainStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  thickness: number;
  alpha: number;
  targetY: number;
  angle: number;
  hasSplashed: boolean;
  delay: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
}

interface RippleRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  lineWidth: number;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('resursee-theme') as Theme | null;
    const initialTheme: Theme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    setMounted(true);
  }, []);

  // Run the translucent overlay rain transition (content stays 100% visible)
  const triggerRainTransition = useCallback((targetTheme: Theme) => {
    const canvas = canvasRef.current;

    // Apply the theme change immediately so the CSS smooth color transition starts
    document.documentElement.setAttribute('data-theme', targetTheme);
    setTheme(targetTheme);
    localStorage.setItem('resursee-theme', targetTheme);

    if (!canvas) return;

    // Check for prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    setIsTransitioning(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsTransitioning(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.display = 'block';
    canvas.style.opacity = '1';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const isGoingDark = targetTheme === 'dark';

    // Color definitions for translucent rain (no solid blocks!)
    const streakColor = isGoingDark
      ? { r: 37, g: 99, b: 235 } // Cobalt blue rain
      : { r: 245, g: 158, b: 11 }; // Golden dew rain

    const headColor = isGoingDark
      ? 'rgba(99, 102, 241, ' // Indigo glint
      : 'rgba(251, 191, 36, '; // Amber glint

    // Generate Rain Streaks
    const streakCount = Math.min(120, Math.floor((width * height) / 8000));
    const streaks: RainStreak[] = [];

    for (let i = 0; i < streakCount; i++) {
      const x = Math.random() * (width + 120) - 60;
      const targetY = Math.random() * (height * 0.75) + height * 0.25;
      const speed = Math.random() * 26 + 32; // Fast, natural rain speed

      streaks.push({
        x,
        y: -Math.random() * 300 - 40,
        length: Math.random() * 35 + 25,
        speed,
        thickness: Math.random() * 1.5 + 1.0,
        alpha: Math.random() * 0.45 + 0.35,
        targetY,
        angle: 0.12, // Slight natural wind slant
        hasSplashed: false,
        delay: Math.random() * 20,
      });
    }

    const splashes: SplashParticle[] = [];
    const ripples: RippleRing[] = [];

    let frame = 0;
    const totalFrames = 52; // ~850ms duration

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw and update Ripples on page elements
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += (rip.maxRadius - rip.radius) * 0.15;
        rip.alpha *= 0.88;

        if (rip.alpha > 0.02) {
          ctx.beginPath();
          // Elliptical perspective ripple
          ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.38, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${streakColor.r}, ${streakColor.g}, ${streakColor.b}, ${rip.alpha})`;
          ctx.lineWidth = rip.lineWidth;
          ctx.stroke();
        } else {
          ripples.splice(i, 1);
        }
      }

      // 2. Draw and update Splash Particles
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.85; // Gravity
        sp.alpha -= sp.decay;

        if (sp.alpha > 0.03) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${streakColor.r}, ${streakColor.g}, ${streakColor.b}, ${sp.alpha})`;
          ctx.fill();
        } else {
          splashes.splice(i, 1);
        }
      }

      // 3. Draw and update Rain Streaks
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];

        if (frame < s.delay) continue;

        s.x += Math.sin(s.angle) * s.speed;
        s.y += Math.cos(s.angle) * s.speed;

        // Draw rain line with tapered tail
        const tailX = s.x - Math.sin(s.angle) * s.length;
        const tailY = s.y - Math.cos(s.angle) * s.length;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `rgba(${streakColor.r}, ${streakColor.g}, ${streakColor.b}, 0)`);
        grad.addColorStop(0.7, `rgba(${streakColor.r}, ${streakColor.g}, ${streakColor.b}, ${s.alpha * 0.6})`);
        grad.addColorStop(1, `${headColor}${s.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Spawn splash and ripple when streak reaches target height
        if (s.y >= s.targetY && !s.hasSplashed) {
          s.hasSplashed = true;

          // Add Ripple
          ripples.push({
            x: s.x,
            y: s.targetY,
            radius: 2,
            maxRadius: Math.random() * 16 + 10,
            alpha: Math.random() * 0.45 + 0.35,
            lineWidth: Math.random() * 1.2 + 0.8,
          });

          // Add 2-3 splash beads
          const count = Math.floor(Math.random() * 2) + 2;
          for (let k = 0; k < count; k++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
            const velocity = Math.random() * 4.5 + 2.5;
            splashes.push({
              x: s.x,
              y: s.targetY,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              radius: Math.random() * 1.4 + 0.8,
              alpha: Math.random() * 0.6 + 0.3,
              decay: 0.045,
            });
          }
        }
      }

      // 4. Smooth end of storm fadeout
      if (frame > totalFrames - 15) {
        const fadeProgress = (frame - (totalFrames - 15)) / 15;
        canvas.style.opacity = Math.max(0, 1 - fadeProgress).toString();
      }

      if (frame >= totalFrames) {
        // Complete
        ctx.clearRect(0, 0, width, height);
        canvas.style.display = 'none';
        setIsTransitioning(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const toggleTheme = (e?: React.MouseEvent) => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    triggerRainTransition(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning }}>
      {children}
      {/* Non-blocking, completely transparent canvas overlay for rain drops */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 99999,
          display: 'none',
          transition: 'opacity 0.2s ease-out',
        }}
      />
    </ThemeContext.Provider>
  );
}
