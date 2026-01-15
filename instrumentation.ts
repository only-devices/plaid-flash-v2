// instrumentation.ts - Runs once when the Next.js server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on the server, not in Edge Runtime
    console.log('[instrumentation] Initializing server...');
    
    // Start ngrok tunnel if in development mode with authtoken
    if (process.env.NODE_ENV === 'development' && process.env.NGROK_AUTHTOKEN) {
      try {
        const { startTunnel } = await import('./lib/ngrokManager');
        const tunnelUrl = await startTunnel(3000);
        
        if (tunnelUrl) {
          console.log('[instrumentation] ✓ Ngrok tunnel ready for webhooks');
        }
      } catch (error: any) {
        console.error('[instrumentation] Failed to start ngrok tunnel:', error.message);
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[instrumentation] Ngrok tunnel disabled (no NGROK_AUTHTOKEN)');
    }
  }
}
