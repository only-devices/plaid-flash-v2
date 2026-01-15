import { useState } from 'react';
import JsonHighlight from './JsonHighlight';

interface WebhookEvent {
  id: string;
  webhook_type: string;
  webhook_code: string;
  item_id?: string;
  timestamp: string;
  payload: any;
}

interface WebhookPanelProps {
  webhooks: WebhookEvent[];
  visible: boolean;
}

export default function WebhookPanel({ webhooks, visible }: WebhookPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const handleCopy = async () => {
    try {
      // Copy all webhooks as a JSON array
      await navigator.clipboard.writeText(JSON.stringify(webhooks, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy webhooks:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="webhook-panel-container">
      <div className="webhook-panel">
        <div className="webhook-panel-header">
          <h3>Webhooks</h3>
          {webhooks.length > 0 && (
            <span className="webhook-count">{webhooks.length}</span>
          )}
        </div>
        
        <div className="webhook-panel-content">
          {webhooks.length > 0 ? (
            <>
              <button
                className={`webhook-copy-button ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                aria-label="Copy all webhooks"
              >
                {copied ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
              <div className="webhook-scroll">
                {webhooks.map((webhook, index) => (
                  <div key={webhook.id} className={`webhook-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                    <div className="webhook-item-header">
                      <span className="webhook-time">{formatTimestamp(webhook.timestamp)}</span>
                      <span className="webhook-type">{webhook.webhook_type}</span>
                      <span className="webhook-code">{webhook.webhook_code}</span>
                    </div>
                    <div className="webhook-payload">
                      <JsonHighlight data={webhook.payload} showCopyButton={false} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="webhook-placeholder">
              <pre className="code-block">
                <code>... waiting for webhooks</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
