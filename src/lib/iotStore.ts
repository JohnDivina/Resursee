import { IoTDevice, IoTTelemetry, IoTActuator, IoTWidget } from '@/types/iotCloud';

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

export function getInitialWidgets(userId: string, deviceId: string): IoTWidget[] {
  return [
    {
      id: `w-temp-${deviceId}`,
      userId,
      deviceId,
      type: 'gauge',
      title: 'Ambient Temperature',
      metricKey: 'temperature',
      unit: '°C',
      minVal: 0,
      maxVal: 50,
      color: '#3b82f6',
      gridSpan: 1,
    },
    {
      id: `w-hum-${deviceId}`,
      userId,
      deviceId,
      type: 'gauge',
      title: 'Relative Humidity',
      metricKey: 'humidity',
      unit: '%',
      minVal: 0,
      maxVal: 100,
      color: '#10b981',
      gridSpan: 1,
    },
    {
      id: `w-soil-${deviceId}`,
      userId,
      deviceId,
      type: 'gauge',
      title: 'Soil Moisture',
      metricKey: 'soilMoisture',
      unit: '%',
      minVal: 0,
      maxVal: 100,
      color: '#f59e0b',
      gridSpan: 1,
    },
    {
      id: `w-chart-${deviceId}`,
      userId,
      deviceId,
      type: 'line_chart',
      title: 'Real-Time Telemetry Stream (2s interval)',
      metricKey: 'temperature',
      unit: '°C',
      gridSpan: 3,
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
