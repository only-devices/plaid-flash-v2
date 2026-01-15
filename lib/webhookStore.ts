// In-memory webhook store with SSE broadcasting
// Note: This resets on deployment/restart (acceptable for demo tool)
// Uses globalThis to persist state across hot module reloads in dev mode

export interface WebhookEvent {
  id: string;
  webhook_type: string;
  webhook_code: string;
  item_id?: string;
  timestamp: string;
  payload: any;
}

const MAX_WEBHOOKS = 50;

// Use global to persist across module reloads in dev mode
const globalForWebhooks = globalThis as unknown as {
  webhooks: WebhookEvent[] | undefined;
  clients: Set<ReadableStreamDefaultController> | undefined;
};

// Initialize or reuse existing state
if (!globalForWebhooks.webhooks) {
  globalForWebhooks.webhooks = [];
}
if (!globalForWebhooks.clients) {
  globalForWebhooks.clients = new Set();
}

const webhooks = globalForWebhooks.webhooks;
const clients = globalForWebhooks.clients;

export function addWebhook(payload: any): WebhookEvent {
  const event: WebhookEvent = {
    id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    webhook_type: payload.webhook_type || 'UNKNOWN',
    webhook_code: payload.webhook_code || 'UNKNOWN',
    item_id: payload.item_id,
    timestamp: new Date().toISOString(),
    payload,
  };

  webhooks.unshift(event);
  
  // Keep only the last MAX_WEBHOOKS
  if (webhooks.length > MAX_WEBHOOKS) {
    webhooks.splice(MAX_WEBHOOKS);
  }

  console.log(`[webhookStore] Added webhook. Total: ${webhooks.length}, Connected clients: ${clients.size}`);

  // Broadcast to all connected SSE clients
  broadcastToClients(event);

  return event;
}

export function getWebhooks(): WebhookEvent[] {
  return [...webhooks];
}

export function clearWebhooks(): void {
  webhooks.length = 0;
}

export function addClient(controller: ReadableStreamDefaultController): void {
  clients.add(controller);
  console.log(`[webhookStore] Client connected. Total clients: ${clients.size}`);
}

export function removeClient(controller: ReadableStreamDefaultController): void {
  clients.delete(controller);
  console.log(`[webhookStore] Client disconnected. Total clients: ${clients.size}`);
}

export function getClientCount(): number {
  return clients.size;
}

function broadcastToClients(event: WebhookEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);

  console.log(`[webhookStore] Broadcasting to ${clients.size} clients`);

  clients.forEach((controller) => {
    try {
      controller.enqueue(encoded);
      console.log('[webhookStore] Sent to client successfully');
    } catch (error) {
      console.log('[webhookStore] Failed to send to client, removing');
      // Client disconnected, remove from set
      clients.delete(controller);
    }
  });
}

// Send heartbeat to keep connections alive
export function sendHeartbeat(): void {
  const data = `data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);

  clients.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch (error) {
      clients.delete(controller);
    }
  });
}
