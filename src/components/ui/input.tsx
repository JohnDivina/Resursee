'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useMotionTemplate, useMotionValue, motion } from 'motion/react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const radius = 120; // radius of the mouse tracking spotlight
    const [visible, setVisible] = React.useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
              #2563eb,
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="p-[2px] rounded-[14px] transition duration-300 group/input"
      >
        <input
          type={type}
          className={cn(
            `flex h-11 w-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink)] rounded-[12px] px-3.5 py-2 text-xs font-medium file:border-0 file:bg-transparent 
            file:text-sm file:font-medium placeholder:text-[var(--color-ink-muted)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
            disabled:cursor-not-allowed disabled:opacity-50
            transition duration-300`,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  }
);

Input.displayName = 'Input';
