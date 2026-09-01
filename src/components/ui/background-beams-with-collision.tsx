'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React, { useRef, useState, useEffect } from 'react';

interface BeamOption {
  initialX?: number;
  translateX?: number;
  initialY?: number;
  translateY?: number;
  rotate?: number;
  className?: string;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
}

export const BackgroundBeamsWithCollision = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const beams: BeamOption[] = [
    {
      initialX: 20,
      translateX: 20,
      duration: 6,
      repeatDelay: 3,
      delay: 1,
      className: 'h-16',
    },
    {
      initialX: 180,
      translateX: 180,
      duration: 7,
      repeatDelay: 4,
      delay: 3,
      className: 'h-24',
    },
    {
      initialX: 340,
      translateX: 340,
      duration: 5,
      repeatDelay: 5,
      className: 'h-14',
    },
    {
      initialX: 520,
      translateX: 520,
      duration: 8,
      repeatDelay: 3,
      delay: 2,
      className: 'h-28',
    },
    {
      initialX: 720,
      translateX: 720,
      duration: 6,
      repeatDelay: 4,
      delay: 4,
      className: 'h-20',
    },
    {
      initialX: 920,
      translateX: 920,
      duration: 7,
      repeatDelay: 2,
      delay: 1,
      className: 'h-32',
    },
    {
      initialX: 1120,
      translateX: 1120,
      duration: 5,
      repeatDelay: 4,
      delay: 3,
      className: 'h-16',
    },
    {
      initialX: 1320,
      translateX: 1320,
      duration: 9,
      repeatDelay: 3,
      delay: 2,
      className: 'h-24',
    },
    {
      initialX: 1520,
      translateX: 1520,
      duration: 6,
      repeatDelay: 5,
      delay: 4,
      className: 'h-20',
    },
  ];

  return (
    <div
      ref={parentRef}
      className={cn(
        'relative min-h-screen w-full overflow-hidden bg-transparent flex flex-col',
        className
      )}
    >
      {/* Laser Beams Background Layer (Fixed & Non-blocking) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {beams.map((beam, idx) => (
          <CollisionMechanism
            key={`${beam.initialX}-${idx}`}
            beamOptions={beam}
            containerRef={containerRef}
            parentRef={parentRef}
          />
        ))}
      </div>

      {/* Main Page Content Layer */}
      <div className="relative z-10 flex min-h-screen flex-col flex-1">
        {children}
      </div>

      {/* Collision Floor Anchor */}
      <div
        ref={containerRef}
        className="pointer-events-none absolute bottom-0 inset-x-0 h-1 bg-transparent"
      />
    </div>
  );
};

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement | null>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    beamOptions?: BeamOption;
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({
    detected: false,
    coordinates: null,
  });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX =
            beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;

          setCollision({
            detected: true,
            coordinates: {
              x: relativeX,
              y: relativeY,
            },
          });
          setCycleCollisionDetected(true);
        }
      }
    };

    const animationInterval = setInterval(checkCollision, 40);
    return () => clearInterval(animationInterval);
  }, [cycleCollisionDetected, containerRef, parentRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      const timeout1 = setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
      }, 1600);

      const timeout2 = setTimeout(() => {
        setBeamKey((prevKey) => prevKey + 1);
      }, 1600);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY || '-200px',
          translateX: beamOptions.initialX || '0px',
          rotate: beamOptions.rotate || 0,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || '2400px',
            translateX: beamOptions.translateX || '0px',
            rotate: beamOptions.rotate || 0,
          },
        }}
        transition={{
          duration: beamOptions.duration || 7,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          'absolute left-0 top-0 m-auto h-20 w-px rounded-full bg-gradient-to-t from-blue-600 via-sky-400 to-transparent shadow-[0_0_8px_rgba(37,99,235,0.8)] opacity-75 dark:opacity-90',
          beamOptions.className
        )}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}-${beamKey}`}
            className=""
            style={{
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
});

CollisionMechanism.displayName = 'CollisionMechanism';

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  const spans = Array.from({ length: 22 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 100 - 50),
    directionY: Math.floor(Math.random() * -60 - 15),
  }));

  return (
    <div {...props} className={cn('pointer-events-none absolute z-40 h-2 w-2', props.className)}>
      {/* Light Flash Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute -inset-x-12 top-0 m-auto h-3 w-16 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-xs"
      />
      {/* Exploding Particle Sparks */}
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1, scale: 1.2 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: Math.random() * 1.2 + 0.4, ease: 'easeOut' }}
          className="absolute h-1.5 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]"
        />
      ))}
    </div>
  );
};
