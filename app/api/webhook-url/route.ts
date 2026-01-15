import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production (Vercel), use the VERCEL_URL
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      const webhookUrl = `https://${vercelUrl}/api/webhook`;
      return NextResponse.json({ 
        webhookUrl,
        environment: 'vercel',
        status: 'ready'
      });
    }

    // In development, try to start ngrok tunnel
    if (process.env.NODE_ENV === 'development') {
      // Check if authtoken is configured
      if (!process.env.NGROK_AUTHTOKEN) {
        return NextResponse.json({ 
          webhookUrl: null,
          environment: 'development',
          status: 'no_authtoken',
          message: 'NGROK_AUTHTOKEN not set. Set it in your .env.local file to enable webhooks.',
          help: 'Get your free authtoken at: https://dashboard.ngrok.com/get-started/your-authtoken'
        });
      }

      try {
        // Dynamically import to avoid issues in production builds
        const { startTunnel } = await import('@/lib/ngrokManager');
        const tunnelUrl = await startTunnel(3000);
        
        if (tunnelUrl) {
          const webhookUrl = `${tunnelUrl}/api/webhook`;
          return NextResponse.json({ 
            webhookUrl,
            environment: 'development',
            status: 'ready',
            tunnelUrl
          });
        } else {
          return NextResponse.json({ 
            webhookUrl: null,
            environment: 'development',
            status: 'tunnel_failed',
            message: 'Failed to start ngrok tunnel. Check console for details.'
          });
        }
      } catch (error: any) {
        console.error('Error starting ngrok tunnel:', error);
        return NextResponse.json({ 
          webhookUrl: null,
          environment: 'development',
          status: 'error',
          message: error.message || 'Unknown error starting tunnel'
        });
      }
    }

    // Fallback for other environments
    return NextResponse.json({ 
      webhookUrl: null,
      environment: 'unknown',
      status: 'unavailable',
      message: 'Webhook URL not available in this environment'
    });
  } catch (error: any) {
    console.error('Error getting webhook URL:', error);
    return NextResponse.json({ 
      webhookUrl: null,
      status: 'error',
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
