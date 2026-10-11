'use client';

import React, { useState } from 'react';
import { IoTParameter, ParameterDataType, ParameterPermission } from '@/types/iotCloud';
import {
  X,
  Plus,
  Trash,
  SlidersHorizontal,
  Check,
  Info,
  Broadcast,
} from '@phosphor-icons/react';

interface ParameterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  deviceName: string;
  parameters: IoTParameter[];
  onAddParameter: (param: IoTParameter) => void;
  onDeleteParameter: (paramId: string) => void;
}

export default function ParameterManagerModal({
  isOpen,
  onClose,
  deviceId,
  deviceName,
  parameters,
  onAddParameter,
  onDeleteParameter,
}: ParameterManagerModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [variableName, setVariableName] = useState('');
  const [dataType, setDataType] = useState<ParameterDataType>('float');
  const [permission, setPermission] = useState<ParameterPermission>('read_only');
  const [unit, setUnit] = useState('');
  const [pin, setPin] = useState<string>('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!variableName || variableName === name.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
      setVariableName(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
      );
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !variableName.trim()) return;

    const newParam: IoTParameter = {
      id: `param-${deviceId}-${Date.now()}`,
      deviceId,
      name: name.trim(),
      variableName: variableName.trim(),
      dataType,
      permission,
      unit: unit.trim() || undefined,
      pin: pin ? Number(pin) : undefined,
      currentValue: dataType === 'boolean' ? false : dataType === 'string' ? '' : 0,
      updatedAt: new Date().toISOString(),
    };

    onAddParameter(newParam);
    setName('');
    setVariableName('');
    setUnit('');
    setPin('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <SlidersHorizontal size={16} weight="bold" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Cloud Parameters · {deviceName}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Define the data readings and actuator variables expected from your microcontroller.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Header Action */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono">
              Configured Parameters ({parameters.length})
            </span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                <Plus size={13} weight="bold" />
                <span>Add Cloud Parameter</span>
              </button>
            )}
          </div>

          {/* Add Parameter Drawer / Form */}
          {isAdding && (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#191919] p-4 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                  New Cloud Parameter
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Ambient Light Sensor"
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    C++ Variable Name
                  </label>
                  <input
                    type="text"
                    required
                    value={variableName}
                    onChange={(e) => setVariableName(e.target.value)}
                    placeholder="e.g. ambient_light"
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Data Type
                  </label>
                  <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="float">Float (e.g. 25.4 °C)</option>
                    <option value="integer">Integer (e.g. 640 lux)</option>
                    <option value="boolean">Boolean (ON / OFF)</option>
                    <option value="string">String (Text)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Permission
                  </label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="read_only">Read-Only (ESP32 Sensor)</option>
                    <option value="read_write">Read &amp; Write (Actuator / Switch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Unit / GPIO Pin
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Unit (°C)"
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-xs text-neutral-900 dark:text-white outline-none"
                    />
                    <input
                      type="number"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="GPIO (4)"
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-xs text-neutral-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 cursor-pointer"
                >
                  Save Parameter
                </button>
              </div>
            </form>
          )}

          {/* Parameters List */}
          <div className="space-y-2">
            {parameters.map((param) => (
              <div
                key={param.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161616] transition hover:border-neutral-300 dark:hover:border-neutral-700"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-900 dark:text-white">
                      {param.name}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400">
                      ({param.variableName})
                    </span>
                    {param.pin !== undefined && (
                      <span className="rounded-md bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-700 dark:text-neutral-300">
                        GPIO {param.pin}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="capitalize">{param.dataType}</span>
                    <span>·</span>
                    <span>{param.permission === 'read_write' ? 'Read/Write (Actuator)' : 'Read-Only (Sensor)'}</span>
                    {param.unit && (
                      <>
                        <span>·</span>
                        <span>Unit: {param.unit}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {param.currentValue !== undefined ? String(param.currentValue) : '--'}
                    </span>
                    {param.unit && (
                      <span className="text-[10px] text-neutral-500 ml-1">{param.unit}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteParameter(param.id)}
                    className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer p-1"
                    title="Delete parameter"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}

            {parameters.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-500">
                No parameters configured yet. Click &quot;Add Cloud Parameter&quot; to configure your first sensor reading or relay switch.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2 text-xs font-bold hover:opacity-90 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
