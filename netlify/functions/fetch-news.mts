import type { Config } from '@netlify/functions';

export default async (req: Request) => {
  console.log('[Resursee Cron] Scheduled news ingestion cycle triggered at', new Date().toISOString());

  const appUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${appUrl}/api/news/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'netlify-scheduled-cron',
      }),
    });

    const result = await response.json();
    console.log('[Resursee Cron] Ingestion result:', result);

    return new Response(JSON.stringify({ status: 'ok', result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Resursee Cron] Ingestion error:', error);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  schedule: '0 */6 * * *', // Run every 6 hours
};
