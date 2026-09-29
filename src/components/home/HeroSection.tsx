'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TextFlippingBoard } from '@/components/ui/text-flipping-board';

const MESSAGES: string[] = [
  'Want to build something? or simply explore',
  'Use the tools here to get the job done',
  "No data is saved, it's all in your local device",
];

export default function HeroSection() {
  const [msgIdx, setMsgIdx] = useState(0);

  const next = useCallback(
    () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
    [],
  );

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-rule-subtle)] bg-transparent py-12 sm:py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="flex w-full flex-col items-center justify-center gap-8">
          <TextFlippingBoard text={MESSAGES[msgIdx]} />
        </div>
      </div>
    </section>
  );
}

