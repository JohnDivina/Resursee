'use client';

import React, { useState } from 'react';

interface OrgLogoProps {
  sourceName?: string | null;
  departmentName?: string | null;
  title?: string | null;
  className?: string;
  size?: number;
}

export function OrgLogo({
  sourceName,
  departmentName,
  title,
  className = 'h-7 w-7',
  size = 28,
}: OrgLogoProps) {
  const [hasError, setHasError] = useState(false);

  const textToCheck = `${sourceName || ''} ${departmentName || ''} ${title || ''}`.toUpperCase();
  const isDost = textToCheck.includes('DOST') || textToCheck.includes('DEPARTMENT OF SCIENCE');

  const logoSrc = isDost ? '/logos/dost.svg' : '/logos/clsu.png';
  const logoAlt = isDost ? 'DOST Philippines' : 'CLSU Central Luzon State University';

  if (hasError) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-blue-600/15 text-blue-600 font-bold font-mono text-[10px] ${className}`}>
        {isDost ? 'DOST' : 'CLSU'}
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={logoAlt}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`object-contain shrink-0 select-none ${className}`}
      loading="lazy"
    />
  );
}
