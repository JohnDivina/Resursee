/**
 * Environment detection utility to check if Resursee is running on a local machine
 * (localhost, local IP, or native Tauri/Electron container) vs a remote public cloud host.
 */

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return true;

  // 1. Check for native Tauri or Electron desktop runtimes
  const isDesktopContainer =
    Boolean((window as any).__TAURI_INTERNALS__) ||
    Boolean((window as any).__TAURI__) ||
    Boolean((window as any).electron) ||
    Boolean((window as any).process?.versions?.electron);

  if (isDesktopContainer) return true;

  // 2. Check hostname for localhost, 127.0.0.1, or local area network
  const hostname = window.location.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return true;
  }

  // 3. Check for private IPv4 ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  ) {
    return true;
  }

  // Otherwise, it's running on a remote cloud deployment (e.g. Netlify, Vercel, public domain)
  return false;
}
