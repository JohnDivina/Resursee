export type DeviceStatus = 'online' | 'offline' | 'simulating';

export interface IoTDevice {
  id: string;
  userId: string;
  name: string;
  description?: string;
  deviceType: 'esp32' | 'esp8266' | 'arduino' | 'raspberry_pi';
  deviceToken: string;
  status: DeviceStatus;
  lastSeenAt?: string;
  createdAt: string;
  wifiSsid?: string;
  ipAddress?: string;
  rssi?: number;
  firmwareVersion?: string;
}

export interface IoTTelemetry {
  id: string;
  deviceId: string;
  timestamp: string;
  temperature?: number; // °C
  humidity?: number; // %
  light?: number; // lux
  soilMoisture?: number; // %
  battery?: number; // %
  customFields?: Record<string, number | string | boolean>;
}

export interface IoTActuator {
  id: string;
  deviceId: string;
  name: string;
  pin: number;
  state: boolean; // true = ON, false = OFF
  updatedAt: string;
}

export type WidgetType = 'gauge' | 'line_chart' | 'switch' | 'stat_card' | 'device_status';

export interface IoTWidget {
  id: string;
  userId: string;
  deviceId: string;
  type: WidgetType;
  title: string;
  metricKey: 'temperature' | 'humidity' | 'light' | 'soilMoisture' | 'battery';
  unit: string;
  minVal?: number;
  maxVal?: number;
  color?: string;
  actuatorId?: string;
  gridSpan?: number; // 1, 2, or 3 cols
}

export interface IngestPayload {
  deviceToken: string;
  temperature?: number;
  humidity?: number;
  light?: number;
  soilMoisture?: number;
  battery?: number;
  rssi?: number;
  ipAddress?: string;
  customData?: Record<string, unknown>;
}

export interface IngestResponse {
  success: boolean;
  timestamp: string;
  message?: string;
  actuatorStates?: Record<string, boolean>; // e.g., { "pin_4": true, "pin_2": false }
}
