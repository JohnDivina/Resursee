import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ESP32 IoT Cloud Architecture & Data Flow | Resursee',
  description:
    'End-to-end technical blueprint and real-time flow diagram showing how ESP32 hardware connects over the Internet to the Resursee Cloud Platform dashboard.',
};

export default function IoTArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
