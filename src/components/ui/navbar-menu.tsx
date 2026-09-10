'use client';

import { motion, type Transition } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const transition: Transition = {
  type: 'spring',
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  href,
  children,
  className,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div onMouseEnter={() => setActive(item)} className={cn('relative', className)}>
      {href ? (
        <Link href={href} className="block">
          <motion.span
            transition={{ duration: 0.3 }}
            className="cursor-pointer text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors select-none"
          >
            {item}
          </motion.span>
        </Link>
      ) : (
        <motion.span
          transition={{ duration: 0.3 }}
          className="cursor-pointer text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors select-none"
        >
          {item}
        </motion.span>
      )}

      {active !== null && children && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50">
              <motion.div
                transition={transition}
                layoutId="active"
                className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-[22px] overflow-hidden border border-black/[0.1] dark:border-white/[0.15] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
              >
                <motion.div layout className="w-max h-full p-4">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
  className,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)}
      className={cn(
        'relative rounded-full border border-black/[0.08] dark:border-white/[0.15] bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-input flex justify-center items-center space-x-4 px-8 py-4',
        className
      )}
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  src?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <Link href={href} className="flex space-x-3 group items-center">
      {src ? (
        <Image
          src={src}
          width={140}
          height={70}
          alt={title}
          unoptimized
          className="shrink-0 rounded-[12px] object-cover h-[70px] w-[140px] border border-black/5 dark:border-white/10 shadow-md group-hover:scale-105 transition-transform duration-200"
        />
      ) : icon ? (
        <div className="shrink-0 rounded-[12px] h-[70px] w-[140px] flex items-center justify-center bg-[var(--color-paper-muted)] border border-black/5 dark:border-white/10 shadow-xs group-hover:scale-105 transition-transform duration-200">
          {icon}
        </div>
      ) : null}
      <div>
        <h4 className="text-sm font-bold mb-1 text-black dark:text-white group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </h4>
        <p className="text-neutral-600 dark:text-neutral-400 text-xs max-w-[12rem] leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({
  children,
  className,
  href,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  [key: string]: any;
}) => {
  return (
    <Link
      href={href}
      {...rest}
      className={cn(
        'text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white text-xs lg:text-sm font-medium transition-colors block py-0.5',
        className
      )}
    >
      {children}
    </Link>
  );
};
