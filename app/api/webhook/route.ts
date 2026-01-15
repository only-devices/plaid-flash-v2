import { NextRequest, NextResponse } from 'next/server';
import { addWebhook } from '@/lib/webhookStore';

// Note: Using Node.js runtime (not Edge) so webhook store shares memory with SSE stream

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('Received webhook:', JSON.stringify(payload, null, 2));
    
    // Store the webhook and broadcast to SSE clients
    const event = addWebhook(payload);
    
    console.log('Webhook stored with ID:', event.id);
    
    // Plaid requires a 200 response immediately
    return NextResponse.json({ 
      received: true, 
      webhook_id: event.id 
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    
    // Still return 200 to Plaid to prevent retries for malformed requests
    // In production, you might want to log this for investigation
    return NextResponse.json({ 
      received: true, 
      error: 'Failed to process webhook payload' 
    });
  }
}

// Handle GET requests for health checks
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is ready to receive Plaid webhooks' 
  });
}
