'use client';

import React, { useState } from 'react';
import { IoTActuator } from '@/types/iotCloud';
import { Power, Lightning, Clock } from '@phosphor-icons/react';

interface RelaySwitchProps {
  actuator: IoTActuator;
  onToggle: (actuator: IoTActuator, newState: boolean) => Promise<void>;
}

export default function RelaySwitch({ actuator, onToggle }: RelaySwitchProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggle(actuator, !actuator.state);
    } catch (err) {
      console.error('Failed to toggle actuator:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-xs transition-all hover:border-[var(--color-rule-strong)]">
      <div className="flex items-center gap-3.5">
        {/* LED Glow Indicator */}
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[16px] transition-all duration-300 ${
            actuator.state
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : 'bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)]'
          }`}
        >
          <Power size={20} weight="bold" />
        </div>

        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[var(--color-ink)]">
            {actuator.name}
          </h4>
          <p className="mt-0.5 font-mono text-[10.5px] text-[var(--color-ink-muted)] flex items-center gap-1.5">
            <span>GPIO Pin {actuator.pin}</span>
            <span>•</span>
            <span
              className={`font-bold ${
                actuator.state ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'
              }`}
            >
              {actuator.state ? 'ENERGIZED (HIGH)' : 'DE-ENERGIZED (LOW)'}
            </span>
          </p>
        </div>
      </div>

      {/* Switch Toggle */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
          actuator.state ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
        } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            actuator.state ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
