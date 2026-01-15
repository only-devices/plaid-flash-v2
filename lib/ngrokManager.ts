// ngrok tunnel manager for localhost webhook testing
// Only used in development mode
// Uses the official @ngrok/ngrok SDK

// Use globalThis to persist state across Next.js hot reloads
const globalForNgrok = globalThis as unknown as {
  ngrokTunnelUrl: string | null;
  ngrokTunnelPromise: Promise<string | null> | null;
  ngrokListener: any;
};

// Initialize globals if not set
globalForNgrok.ngrokTunnelUrl = globalForNgrok.ngrokTunnelUrl ?? null;
globalForNgrok.ngrokTunnelPromise = globalForNgrok.ngrokTunnelPromise ?? null;
globalForNgrok.ngrokListener = globalForNgrok.ngrokListener ?? null;

export async function startTunnel(port: number = 3000): Promise<string | null> {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    console.log('[ngrok] Skipping tunnel in non-development environment');
    return null;
  }

  // Check for authtoken
  const authtoken = process.env.NGROK_AUTHTOKEN;
  if (!authtoken) {
    console.warn('[ngrok] NGROK_AUTHTOKEN not set. Webhooks will not be available in development.');
    console.warn('[ngrok] Get your free authtoken at: https://dashboard.ngrok.com/get-started/your-authtoken');
    return null;
  }

  // Return cached URL if already connected
  if (globalForNgrok.ngrokTunnelUrl) {
    console.log(`[ngrok] Reusing existing tunnel: ${globalForNgrok.ngrokTunnelUrl}`);
    return globalForNgrok.ngrokTunnelUrl;
  }

  // Return existing promise if tunnel is being started
  if (globalForNgrok.ngrokTunnelPromise) {
    return globalForNgrok.ngrokTunnelPromise;
  }

  // Start new tunnel
  globalForNgrok.ngrokTunnelPromise = createTunnel(port, authtoken);
  globalForNgrok.ngrokTunnelUrl = await globalForNgrok.ngrokTunnelPromise;
  globalForNgrok.ngrokTunnelPromise = null;
  
  return globalForNgrok.ngrokTunnelUrl;
}

async function createTunnel(port: number, authtoken: string): Promise<string | null> {
  try {
    // Dynamically import @ngrok/ngrok to avoid issues in production builds
    const ngrok = await import('@ngrok/ngrok');
    
    console.log(`[ngrok] Starting tunnel to localhost:${port}...`);
    
    // Create a forward listener with authtoken
    globalForNgrok.ngrokListener = await ngrok.forward({
      addr: port,
      authtoken: authtoken,
    });
    
    const url = globalForNgrok.ngrokListener.url();
    console.log(`[ngrok] Tunnel established: ${url}`);
    
    return url;
  } catch (error: any) {
    console.error('[ngrok] Failed to start tunnel:', error.message);
    
    // Common error handling
    if (error.message?.includes('authtoken')) {
      console.error('[ngrok] Invalid or expired authtoken. Please update NGROK_AUTHTOKEN.');
    } else if (error.message?.includes('address already in use')) {
      console.error('[ngrok] Port already in use. Try closing other ngrok instances.');
    }
    
    return null;
  }
}

export async function stopTunnel(): Promise<void> {
  if (globalForNgrok.ngrokListener) {
    try {
      await globalForNgrok.ngrokListener.close();
      console.log('[ngrok] Tunnel disconnected');
    } catch (error) {
      console.error('[ngrok] Error disconnecting:', error);
    }
    globalForNgrok.ngrokListener = null;
    globalForNgrok.ngrokTunnelUrl = null;
  }
}

export function getTunnelUrl(): string | null {
  return globalForNgrok.ngrokTunnelUrl;
}

export function isTunnelActive(): boolean {
  return globalForNgrok.ngrokTunnelUrl !== null;
}
