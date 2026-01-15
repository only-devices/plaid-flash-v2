import { NextRequest } from 'next/server';
import { addClient, removeClient, getWebhooks, sendHeartbeat } from '@/lib/webhookStore';

// SSE endpoint for real-time webhook updates
// Note: Cannot use Edge runtime with SSE as we need long-running connections

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  let controller: ReadableStreamDefaultController;
  let heartbeatInterval: NodeJS.Timeout;
  
  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      
      // Register this client
      addClient(controller);
      
      // Send initial connection message with existing webhooks
      const existingWebhooks = getWebhooks();
      const initMessage = `data: ${JSON.stringify({ 
        type: 'connected', 
        webhooks: existingWebhooks,
        timestamp: new Date().toISOString() 
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));
      
      // Send heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        sendHeartbeat();
      }, 30000);
    },
    cancel() {
      // Clean up when client disconnects
      if (controller) {
        removeClient(controller);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    },
  });
}
