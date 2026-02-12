import { useMemo } from 'react';
import JsonHighlight from '@/components/JsonHighlight';
import ArrowButton from '@/components/ArrowButton';

type AnyWebhookEvent = {
  id?: string;
  webhook_type?: string;
  webhook_code?: string;
  timestamp?: string;
  payload?: any;
};

interface MultiItemWebhookPanelProps {
  enabled: boolean;
  linkToken: string | null;
  webhooks: AnyWebhookEvent[];
  onForward: (publicTokens: string[]) => void;
  title?: string;
  allowForwardWithoutTokens?: boolean;
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function MultiItemWebhookPanel({
  enabled,
  linkToken,
  webhooks,
  onForward,
  title = 'Webhooks',
  allowForwardWithoutTokens = false,
}: MultiItemWebhookPanelProps) {
  const relevantWebhooks = useMemo(() => {
    if (!enabled) return [];
    return (webhooks || []).filter((w) => {
      const webhookType = w.webhook_type ?? w.payload?.webhook_type;
      const webhookCode = w.webhook_code ?? w.payload?.webhook_code;
      if (webhookType !== 'LINK') return false;
      if (webhookCode !== 'ITEM_ADD_RESULT' && webhookCode !== 'SESSION_FINISHED') return false;

      if (linkToken) {
        const payloadLinkToken = w.payload?.link_token;
        if (payloadLinkToken && payloadLinkToken !== linkToken) return false;
      }
      return true;
    });
  }, [enabled, webhooks, linkToken]);

  const sessionFinished = useMemo(() => {
    return relevantWebhooks.find((w) => (w.webhook_code ?? w.payload?.webhook_code) === 'SESSION_FINISHED');
  }, [relevantWebhooks]);

  const forwardState = useMemo(() => {
    const status = sessionFinished?.payload?.status;
    const publicTokens: unknown = sessionFinished?.payload?.public_tokens;
    const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : undefined;

    if (!sessionFinished) {
      return { canForward: false, publicTokens: [] as string[] };
    }

    // Accept both SUCCESS and success (some payloads use lowercase)
    if (normalizedStatus && normalizedStatus !== 'SUCCESS') {
      return {
        canForward: false,
        reason: `Session ${String(status).toLowerCase()}`,
        publicTokens: [] as string[],
      };
    }

    if (!Array.isArray(publicTokens) || publicTokens.length === 0) {
      if (allowForwardWithoutTokens) {
        return { canForward: true, reason: '', publicTokens: [] as string[] };
      }
      return { canForward: false, reason: 'No public_tokens found', publicTokens: [] as string[] };
    }

    return { canForward: true, reason: '', publicTokens: publicTokens as string[] };
  }, [linkToken, sessionFinished]);

  if (!enabled) return null;

  return (
    <div className="multiitem-webhook-panel">
      <div className="multiitem-webhook-panel-header">
        <div className="multiitem-webhook-panel-title">
          <h3>{title}</h3>
          {relevantWebhooks.length > 0 && (
            <span className="webhook-count">{relevantWebhooks.length}</span>
          )}
        </div>

        <div className="multiitem-webhook-panel-actions">
          {!forwardState.canForward && (
            <span className="multiitem-webhook-panel-hint">{forwardState.reason}</span>
          )}
        </div>
      </div>

      <div className="multiitem-webhook-panel-content">
        {relevantWebhooks.length > 0 ? (
          <div className="multiitem-webhook-scroll">
            {relevantWebhooks.map((webhook, index) => (
              <div key={webhook.id || index} className={`webhook-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                <div className="webhook-item-header">
                  <span className="webhook-time">{formatTimestamp(webhook.timestamp)}</span>
                  <span className="webhook-type">{webhook.webhook_type}</span>
                  <span className="webhook-code">{webhook.webhook_code}</span>
                </div>
                <div className="webhook-payload">
                  <JsonHighlight data={webhook.payload ?? webhook} showCopyButton={false} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="webhook-placeholder">
            <pre className="code-block">
              <code>... waiting for Link webhooks</code>
            </pre>
          </div>
        )}
      </div>
      <div className="modal-button-row single-button">
        <ArrowButton variant="blue" onClick={() => onForward(forwardState.publicTokens)}
          disabled={!forwardState.canForward} />
      </div>
    </div>
  );
}

