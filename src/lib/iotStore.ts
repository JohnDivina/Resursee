import { IoTDevice, IoTTelemetry, IoTActuator, IoTWidget, IoTParameter } from '@/types/iotCloud';

const STORAGE_KEY_DEVICES = 'resursee_iot_devices';
const STORAGE_KEY_TELEMETRY = 'resursee_iot_telemetry';
const STORAGE_KEY_ACTUATORS = 'resursee_iot_actuators';
const STORAGE_KEY_WIDGETS = 'resursee_iot_widgets';

// Generate default initial device entry awaiting hardware provisioning
export function getInitialDevices(userId: string, userName?: string): IoTDevice[] {
  const shortName = userName ? `${userName.split(' ')[0]}'s Greenhouse` : 'Smart Greenhouse Station';
  return [
    {
      id: `dev-${userId.substring(0, 8)}-gh`,
      userId,
      name: shortName,
      description: `ESP32 Node configured for ${userName || 'User'} awaiting physical hardware pairing.`,
      deviceType: 'esp32',
      deviceToken: `sk_esp32_${userId.substring(0, 6)}_${Math.random().toString(36).substring(2, 8)}`,
      status: 'offline',
      lastSeenAt: undefined,
      createdAt: new Date().toISOString(),
      rssi: -95,
      ipAddress: 'Awaiting Hardware',
      firmwareVersion: 'Pending Setup',
    },
  ];
}

export function getInitialActuators(deviceId: string): IoTActuator[] {
  return [
    {
      id: `act-${deviceId}-pump`,
      deviceId,
      name: 'Water Irrigation Pump (GPIO 2)',
      pin: 2,
      state: false,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `act-${deviceId}-light`,
      name: 'LED Grow Lights (GPIO 4)',
      deviceId,
      pin: 4,
      state: false,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `act-${deviceId}-fan`,
      name: 'Ventilation Exhaust Fan (GPIO 15)',
      deviceId,
      pin: 15,
      state: false,
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getInitialParameters(deviceId: string): IoTParameter[] {
  return [
    {
      id: `param-${deviceId}-temp`,
      deviceId,
      name: 'Ambient Temperature',
      variableName: 'temperature',
      dataType: 'float',
      permission: 'read_only',
      unit: '°C',
      currentValue: 24.8,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `param-${deviceId}-hum`,
      deviceId,
      name: 'Relative Humidity',
      variableName: 'humidity',
      dataType: 'float',
      permission: 'read_only',
      unit: '%',
      currentValue: 62.4,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `param-${deviceId}-soil`,
      deviceId,
      name: 'Soil Moisture Level',
      variableName: 'soilMoisture',
      dataType: 'integer',
      permission: 'read_only',
      unit: '%',
      pin: 34,
      currentValue: 58,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `param-${deviceId}-light`,
      deviceId,
      name: 'Ambient Light Intensity',
      variableName: 'light',
      dataType: 'integer',
      permission: 'read_only',
      unit: 'lux',
      pin: 35,
      currentValue: 640,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `param-${deviceId}-pump`,
      deviceId,
      name: 'Irrigation Pump Relay',
      variableName: 'relay_pump',
      dataType: 'boolean',
      permission: 'read_write',
      pin: 2,
      currentValue: false,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `param-${deviceId}-lights`,
      deviceId,
      name: 'Grow Light Relay',
      variableName: 'relay_lights',
      dataType: 'boolean',
      permission: 'read_write',
      pin: 4,
      currentValue: false,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `param-${deviceId}-fan`,
      deviceId,
      name: 'Exhaust Fan Relay',
      variableName: 'relay_fan',
      dataType: 'boolean',
      permission: 'read_write',
      pin: 15,
      currentValue: false,
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getInitialWidgets(userId: string, deviceId: string): IoTWidget[] {
  return [
    {
      id: `w-temp-${deviceId}`,
      userId,
      deviceId,
      parameterId: `param-${deviceId}-temp`,
      type: 'gauge',
      title: 'Ambient Temperature',
      unit: '°C',
      minVal: 0,
      maxVal: 50,
      gridSpan: 1,
    },
    {
      id: `w-hum-${deviceId}`,
      userId,
      deviceId,
      parameterId: `param-${deviceId}-hum`,
      type: 'gauge',
      title: 'Relative Humidity',
      unit: '%',
      minVal: 0,
      maxVal: 100,
      gridSpan: 1,
    },
    {
      id: `w-soil-${deviceId}`,
      userId,
      deviceId,
      parameterId: `param-${deviceId}-soil`,
      type: 'gauge',
      title: 'Soil Moisture Probe',
      unit: '%',
      minVal: 0,
      maxVal: 100,
      gridSpan: 1,
    },
    {
      id: `w-light-${deviceId}`,
      userId,
      deviceId,
      parameterId: `param-${deviceId}-light`,
      type: 'stat_card',
      title: 'Solar / Lux Sensor',
      unit: 'lux',
      gridSpan: 1,
    },
    {
      id: `w-pump-${deviceId}`,
      userId,
      deviceId,
      parameterId: `param-${deviceId}-pump`,
      type: 'switch',
      title: 'Irrigation Pump Relay',
      gridSpan: 1,
    },
    {
      id: `w-chart-${deviceId}`,
      userId,
      deviceId,
      parameterId: `param-${deviceId}-temp`,
      type: 'line_chart',
      title: 'Temperature Telemetry Stream',
      unit: '°C',
      minVal: 0,
      maxVal: 50,
      gridSpan: 2,
    },
  ];
}

// Generate a set of realistic initial telemetry history
export function generateSeedTelemetry(deviceId: string, count = 20): IoTTelemetry[] {
  const points: IoTTelemetry[] = [];
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * 3000).toISOString();
    const tempNoise = Math.sin(i / 3) * 2 + (Math.random() * 0.8 - 0.4);
    const humNoise = Math.cos(i / 4) * 3 + (Math.random() * 1.2 - 0.6);

    points.push({
      id: `telem-${deviceId}-${now - i * 3000}`,
      deviceId,
      timestamp: time,
      temperature: parseFloat((25.4 + tempNoise).toFixed(1)),
      humidity: parseFloat((64.2 + humNoise).toFixed(1)),
      light: Math.floor(620 + Math.random() * 80),
      soilMoisture: Math.floor(58 + Math.random() * 6),
      battery: 98,
    });
  }

  return points;
}

const STORAGE_KEY_PARAMETERS = 'resursee_iot_parameters';

export function loadDeviceParameters(deviceId: string): IoTParameter[] {
  if (typeof window === 'undefined') return getInitialParameters(deviceId);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PARAMETERS}_${deviceId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return getInitialParameters(deviceId);
}

export function saveDeviceParameters(deviceId: string, params: IoTParameter[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PARAMETERS}_${deviceId}`, JSON.stringify(params));
  } catch {}
}

export function loadDeviceWidgets(userId: string, deviceId: string): IoTWidget[] {
  if (typeof window === 'undefined') return getInitialWidgets(userId, deviceId);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_WIDGETS}_${deviceId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return getInitialWidgets(userId, deviceId);
}

export function saveDeviceWidgets(deviceId: string, widgets: IoTWidget[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_WIDGETS}_${deviceId}`, JSON.stringify(widgets));
  } catch {}
}
