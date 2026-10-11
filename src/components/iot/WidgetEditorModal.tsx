'use client';

import React, { useState, useEffect } from 'react';
import { IoTWidget, IoTParameter, WidgetType } from '@/types/iotCloud';
import {
  X,
  Gauge,
  ToggleRight,
  ChartLine,
  Cards,
  CheckCircle,
  Plus,
} from '@phosphor-icons/react';

interface WidgetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWidget: (widget: IoTWidget) => void;
  parameters: IoTParameter[];
  editingWidget?: IoTWidget | null;
  userId: string;
  deviceId: string;
}

const WIDGET_TYPES: Array<{
  type: WidgetType;
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    type: 'gauge',
    title: 'Gauge',
    desc: 'Circular radial dial for numeric floats and integers.',
    icon: <Gauge size={18} weight="bold" />,
  },
  {
    type: 'stat_card',
    title: 'Value Card',
    desc: 'Large metric reading with unit and discrete status dot.',
    icon: <Cards size={18} weight="bold" />,
  },
  {
    type: 'switch',
    title: 'Switch',
    desc: 'Interactive toggle switch for boolean relays and actuators.',
    icon: <ToggleRight size={18} weight="bold" />,
  },
  {
    type: 'line_chart',
    title: 'Time Series Chart',
    desc: 'Streaming multi-point trend graph for telemetry history.',
    icon: <ChartLine size={18} weight="bold" />,
  },
  {
    type: 'status_indicator',
    title: 'Status Dot',
    desc: 'Discrete monochrome presence indicator for states and alerts.',
    icon: <CheckCircle size={18} weight="bold" />,
  },
];

export default function WidgetEditorModal({
  isOpen,
  onClose,
  onSaveWidget,
  parameters,
  editingWidget,
  userId,
  deviceId,
}: WidgetEditorModalProps) {
  const [title, setTitle] = useState('');
  const [widgetType, setWidgetType] = useState<WidgetType>('gauge');
  const [parameterId, setParameterId] = useState('');
  const [unit, setUnit] = useState('');
  const [minVal, setMinVal] = useState<number>(0);
  const [maxVal, setMaxVal] = useState<number>(100);
  const [gridSpan, setGridSpan] = useState<number>(1);

  useEffect(() => {
    if (editingWidget) {
      setTitle(editingWidget.title);
      setWidgetType(editingWidget.type);
      setParameterId(editingWidget.parameterId);
      setUnit(editingWidget.unit || '');
      setMinVal(editingWidget.minVal ?? 0);
      setMaxVal(editingWidget.maxVal ?? 100);
      setGridSpan(editingWidget.gridSpan ?? 1);
    } else {
      const defaultParam = parameters[0];
      setTitle(defaultParam ? defaultParam.name : 'New Telemetry Widget');
      setWidgetType(defaultParam?.dataType === 'boolean' ? 'switch' : 'gauge');
      setParameterId(defaultParam ? defaultParam.id : '');
      setUnit(defaultParam?.unit || '');
      setMinVal(0);
      setMaxVal(100);
      setGridSpan(1);
    }
  }, [editingWidget, isOpen, parameters]);

  // When selected parameter changes, auto-populate recommended unit and type
  const handleParameterSelect = (pId: string) => {
    setParameterId(pId);
    const param = parameters.find((p) => p.id === pId);
    if (param) {
      if (!editingWidget) {
        setTitle(param.name);
      }
      setUnit(param.unit || '');
      if (param.dataType === 'boolean') {
        setWidgetType('switch');
      } else if (widgetType === 'switch') {
        setWidgetType('gauge');
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !parameterId) return;

    const widget: IoTWidget = {
      id: editingWidget?.id || `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      deviceId,
      parameterId,
      type: widgetType,
      title: title.trim(),
      unit: unit.trim() || undefined,
      minVal: ['gauge', 'line_chart'].includes(widgetType) ? Number(minVal) : undefined,
      maxVal: ['gauge', 'line_chart'].includes(widgetType) ? Number(maxVal) : undefined,
      gridSpan: Number(gridSpan),
    };

    onSaveWidget(widget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {editingWidget ? 'Edit Telemetry Widget' : 'Add Display Widget'}
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Bind a visual display holder to one of your device&apos;s cloud parameters.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Widget Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2 font-mono">
              Widget Display Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WIDGET_TYPES.map((wt) => (
                <button
                  key={wt.type}
                  type="button"
                  onClick={() => setWidgetType(wt.type)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                    widgetType === wt.type
                      ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800'
                      : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#181818] hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <span className="text-neutral-800 dark:text-neutral-200 mb-1">{wt.icon}</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs">{wt.title}</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight pt-0.5 line-clamp-2">
                    {wt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bound Parameter Selector */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1 font-mono">
              Link To Cloud Parameter
            </label>
            {parameters.length === 0 ? (
              <p className="text-neutral-500 text-[11px]">No parameters configured for this device yet.</p>
            ) : (
              <select
                value={parameterId}
                onChange={(e) => handleParameterSelect(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
              >
                {parameters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.variableName}) · {p.dataType} {p.unit ? `[${p.unit}]` : ''} · {p.permission === 'read_write' ? 'Read/Write Actuator' : 'Read-Only Sensor'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Widget Title */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1 font-mono">
              Widget Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ambient Temperature, Water Reservoir"
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none"
            />
          </div>

          {/* Unit & Grid Span */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                Unit (Optional)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. °C, %, lux, V"
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                Grid Width
              </label>
              <select
                value={gridSpan}
                onChange={(e) => setGridSpan(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
              >
                <option value={1}>1 Column (Standard Card)</option>
                <option value={2}>2 Columns (Wide)</option>
                <option value={3}>3 Columns (Full Width)</option>
              </select>
            </div>
          </div>

          {/* Min & Max Range for Gauges / Charts */}
          {['gauge', 'line_chart'].includes(widgetType) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                  Minimum Value
                </label>
                <input
                  type="number"
                  value={minVal}
                  onChange={(e) => setMinVal(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                  Maximum Value
                </label>
                <input
                  type="number"
                  value={maxVal}
                  onChange={(e) => setMaxVal(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2 text-xs font-bold hover:opacity-90 cursor-pointer shadow-xs"
            >
              {editingWidget ? 'Update Widget' : 'Add Widget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
