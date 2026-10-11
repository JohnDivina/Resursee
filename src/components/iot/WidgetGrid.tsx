'use client';

import React, { useState } from 'react';
import {
  IoTWidget,
  IoTParameter,
  IoTTelemetry,
  IoTDevice,
} from '@/types/iotCloud';
import {
  Plus,
  PencilSimple,
  Trash,
  SlidersHorizontal,
  Power,
  Gauge,
  Cards,
  ChartLine,
  CheckCircle,
  Thermometer,
  Drop,
  Sun,
  BatteryHigh,
  Clock,
} from '@phosphor-icons/react';
import WidgetEditorModal from '@/components/iot/WidgetEditorModal';
import ParameterManagerModal from '@/components/iot/ParameterManagerModal';

interface WidgetGridProps {
  device: IoTDevice;
  widgets: IoTWidget[];
  parameters: IoTParameter[];
  telemetryHistory: IoTTelemetry[];
  onSaveWidget: (widget: IoTWidget) => void;
  onDeleteWidget: (widgetId: string) => void;
  onAddParameter: (param: IoTParameter) => void;
  onDeleteParameter: (paramId: string) => void;
  onToggleParameter: (param: IoTParameter, newState: boolean) => Promise<void>;
}

export default function WidgetGrid({
  device,
  widgets,
  parameters,
  telemetryHistory,
  onSaveWidget,
  onDeleteWidget,
  onAddParameter,
  onDeleteParameter,
  onToggleParameter,
}: WidgetGridProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [paramModalOpen, setParamModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<IoTWidget | null>(null);
  const [togglingParamId, setTogglingParamId] = useState<string | null>(null);

  const handleEditWidget = (w: IoTWidget) => {
    setEditingWidget(w);
    setEditorOpen(true);
  };

  const handleCreateWidget = () => {
    setEditingWidget(null);
    setEditorOpen(true);
  };

  const handleSwitchToggle = async (param: IoTParameter) => {
    setTogglingParamId(param.id);
    try {
      const current = Boolean(param.currentValue);
      await onToggleParameter(param, !current);
    } finally {
      setTogglingParamId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Add Widget + Manage Parameters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Cloud Dashboard &amp; Display Widgets
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              {widgets.length} Widget{widgets.length === 1 ? '' : 's'} Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-0.5">
            Add, edit, or remove display holders linked to <strong>{device.name}</strong>&apos;s cloud parameters.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setParamModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <SlidersHorizontal size={14} weight="bold" />
            <span>Parameters ({parameters.length})</span>
          </button>

          <button
            type="button"
            onClick={handleCreateWidget}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-xs"
          >
            <Plus size={14} weight="bold" />
            <span>Add Widget</span>
          </button>
        </div>
      </div>

      {/* Widgets Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => {
          const param = parameters.find((p) => p.id === widget.parameterId);
          const rawValue = param?.currentValue;
          const displayUnit = widget.unit || param?.unit || '';
          const min = widget.minVal ?? 0;
          const max = widget.maxVal ?? 100;

          const colSpanClass =
            widget.gridSpan === 3
              ? 'lg:col-span-3 md:col-span-2'
              : widget.gridSpan === 2
              ? 'md:col-span-2'
              : 'col-span-1';

          return (
            <div
              key={widget.id}
              className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 flex flex-col justify-between transition hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs ${colSpanClass}`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {widget.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono pt-0.5">
                    <span>Param: {param ? param.variableName : 'Unbound'}</span>
                    {param?.dataType && <span>· {param.dataType}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEditWidget(widget)}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
                    title="Edit widget"
                  >
                    <PencilSimple size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteWidget(widget.id)}
                    className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer"
                    title="Delete widget"
                  >
                    <Trash size={13} />
                  </button>
                </div>
              </div>

              {/* Card Body by Widget Type */}
              <div className="py-4 flex-1 flex flex-col items-center justify-center">
                {/* 1. GAUGE WIDGET */}
                {widget.type === 'gauge' && (
                  <div className="flex flex-col items-center justify-center w-full">
                    {(() => {
                      const numVal = typeof rawValue === 'number' ? rawValue : min;
                      const pct = Math.min(100, Math.max(0, ((numVal - min) / (max - min)) * 100));
                      const radius = 48;
                      const circ = 2 * Math.PI * radius;
                      const offset = circ - (pct / 100) * (circ * 0.75);

                      return (
                        <div className="relative flex items-center justify-center">
                          <svg className="h-32 w-32 -rotate-135 transform" viewBox="0 0 120 120">
                            {/* Track */}
                            <circle
                              cx="60"
                              cy="60"
                              r={radius}
                              className="stroke-neutral-200 dark:stroke-neutral-800"
                              strokeWidth="8"
                              strokeDasharray={circ}
                              strokeDashoffset={circ * 0.25}
                              strokeLinecap="round"
                              fill="transparent"
                            />
                            {/* Fill */}
                            <circle
                              cx="60"
                              cy="60"
                              r={radius}
                              className="stroke-neutral-900 dark:stroke-white transition-all duration-500 ease-out"
                              strokeWidth="8"
                              strokeDasharray={circ}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              fill="transparent"
                            />
                          </svg>

                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                              {rawValue !== undefined ? String(rawValue) : '--'}
                            </span>
                            {displayUnit && (
                              <span className="text-[10px] text-neutral-500 font-semibold">{displayUnit}</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-between w-full text-[10px] text-neutral-400 font-mono px-4 pt-1">
                      <span>{min} {displayUnit}</span>
                      <span>{max} {displayUnit}</span>
                    </div>
                  </div>
                )}

                {/* 2. SWITCH WIDGET (ACTUATOR RELAY) */}
                {widget.type === 'switch' && (
                  <div className="flex flex-col items-center justify-center space-y-3 w-full py-2">
                    <button
                      type="button"
                      disabled={!param || togglingParamId === param.id}
                      onClick={() => param && handleSwitchToggle(param)}
                      className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        param?.currentValue
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md scale-105'
                          : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      <Power size={28} weight="bold" />
                    </button>

                    <div className="text-center">
                      <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white block">
                        {param?.currentValue ? 'STATE: ON' : 'STATE: OFF'}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {param?.pin ? `GPIO ${param.pin} Relay` : 'Virtual Actuator'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. VALUE / STAT CARD WIDGET */}
                {widget.type === 'stat_card' && (
                  <div className="flex flex-col items-center justify-center space-y-1.5 py-4 w-full">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
                        {rawValue !== undefined ? String(rawValue) : '--'}
                      </span>
                      {displayUnit && (
                        <span className="text-xs text-neutral-500 font-bold">{displayUnit}</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                      Live Stream
                    </span>
                  </div>
                )}

                {/* 4. LINE CHART WIDGET */}
                {widget.type === 'line_chart' && (
                  <div className="w-full flex flex-col space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                      <span>Latest: <strong>{rawValue !== undefined ? String(rawValue) : '--'} {displayUnit}</strong></span>
                      <span>History: {telemetryHistory.length} pulses</span>
                    </div>

                    {/* SVG Sparkline */}
                    <div className="h-28 w-full rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] p-2 border border-neutral-200/60 dark:border-neutral-800 flex items-end">
                      {telemetryHistory.length > 1 ? (
                        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                          {(() => {
                            const key = param?.variableName || 'temperature';
                            const values = telemetryHistory.map((t) => {
                              const v = (t as any)[key];
                              return typeof v === 'number' ? v : min;
                            });
                            const localMin = Math.min(...values, min);
                            const localMax = Math.max(...values, max);
                            const range = localMax - localMin || 1;

                            const points = values.map((val, idx) => {
                              const x = (idx / (values.length - 1)) * 300;
                              const y = 90 - ((val - localMin) / range) * 80;
                              return `${x},${y}`;
                            }).join(' ');

                            return (
                              <>
                                <polyline
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-neutral-900 dark:text-white"
                                  points={points}
                                />
                              </>
                            );
                          })()}
                        </svg>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                          Awaiting telemetry stream packets...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. STATUS INDICATOR */}
                {widget.type === 'status_indicator' && (
                  <div className="flex flex-col items-center justify-center space-y-2 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                      <CheckCircle size={20} weight="bold" />
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {rawValue !== undefined ? String(rawValue) : 'Normal'}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80 pt-2.5 text-[10px] text-neutral-400">
                <span>{param?.permission === 'read_write' ? 'Bi-Directional' : 'Sensor Read'}</span>
                <span>{param?.updatedAt ? new Date(param.updatedAt).toLocaleTimeString() : 'Synced'}</span>
              </div>
            </div>
          );
        })}

        {widgets.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-[#121212]/50 p-12 text-center space-y-3">
            <Gauge size={32} className="mx-auto text-neutral-400" />
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              No Display Widgets Configured
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Create widgets to display real-time sensor readings or add interactive toggle switches for your ESP32 relays.
            </p>
            <button
              type="button"
              onClick={handleCreateWidget}
              className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold hover:opacity-90 cursor-pointer"
            >
              + Add First Widget
            </button>
          </div>
        )}
      </div>

      {/* Widget Editor Modal */}
      <WidgetEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaveWidget={onSaveWidget}
        parameters={parameters}
        editingWidget={editingWidget}
        userId={device.userId}
        deviceId={device.id}
      />

      {/* Parameter Manager Modal */}
      <ParameterManagerModal
        isOpen={paramModalOpen}
        onClose={() => setParamModalOpen(false)}
        deviceId={device.id}
        deviceName={device.name}
        parameters={parameters}
        onAddParameter={onAddParameter}
        onDeleteParameter={onDeleteParameter}
      />
    </div>
  );
}
