import React, { useMemo, useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ArrowButton from './ArrowButton';
import JsonHighlight from './JsonHighlight';

export type CashflowUpdatesWebhookEvent = {
  id: string;
  webhook_type: string;
  webhook_code: string;
  item_id?: string;
  timestamp: string;
  payload: any;
};

const QUALIFYING_CODES = new Set(['CASH_FLOW_INSIGHTS_UPDATED', 'INSIGHTS_UPDATED']);

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function CashflowUpdatesWebhookPanel(props: {
  visible: boolean;
  subscribedItemId?: string | null;
  events: CashflowUpdatesWebhookEvent[];
  allowManualPaste: boolean;
  manualPayload: string;
  onManualPayloadChange: (value: string) => void;
  onManualAdd: () => void;
  manualParseError?: string | null;
  canForward: boolean;
  onForward: () => void;
}) {
  const {
    visible,
    subscribedItemId,
    events,
    allowManualPaste,
    manualPayload,
    onManualPayloadChange,
    onManualAdd,
    manualParseError,
    canForward,
    onForward,
  } = props;

  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    return events
      .filter((e) => e.webhook_type === 'CASH_FLOW_UPDATES')
      .filter((e) => !subscribedItemId || !e.item_id || e.item_id === subscribedItemId);
  }, [events, subscribedItemId]);

  const qualifyingCount = useMemo(() => {
    return filtered.filter((e) => QUALIFYING_CODES.has(e.webhook_code)).length;
  }, [filtered]);

  if (!visible) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(filtered, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy webhooks:', err);
    }
  };

  return (
    <div>
      {allowManualPaste && (
        <div className="account-data" style={{ marginBottom: 16 }}>
          <p style={{ marginTop: 0, marginBottom: 10, opacity: 0.85 }}>
            Paste webhook JSON payload(s). You can paste either a single webhook object or an array of webhook objects.
          </p>
          <div className="code-editor-container" style={{ marginBottom: 10 }}>
            <CodeEditor
              value={manualPayload}
              language="json"
              onChange={(e) => onManualPayloadChange(e.target.value)}
              padding={12}
              data-color-mode="dark"
              style={{
                fontSize: 12,
                fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '12px',
                minHeight: '180px',
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            />
          </div>
          {manualParseError && (
            <div className="config-error" style={{ marginTop: 8 }}>
              {manualParseError}
            </div>
          )}
          <div className="modal-button-row two-buttons" style={{ marginTop: 10 }}>
            <button className="action-button button-blue" onClick={onManualAdd}>
              Add
            </button>
            <ArrowButton variant="blue" disabled={!canForward} onClick={onForward} />
          </div>
        </div>
      )}

      <div className="webhook-panel-embedded">
        <div className="webhook-panel-header">
          <h3>Webhooks</h3>
          {filtered.length > 0 && <span className="webhook-count">{filtered.length}</span>}
          {filtered.length > 0 && (
            <button
              className={`webhook-copy-button ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              aria-label="Copy cashflow updates webhooks"
              title="Copy"
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
          )}
        </div>

        <div className="webhook-panel-content">
          {filtered.length > 0 ? (
            <div className="webhook-scroll">
              {filtered.map((webhook, index) => (
                <div
                  key={webhook.id}
                  className={`webhook-item ${index % 2 === 0 ? 'even' : 'odd'}`}
                  style={QUALIFYING_CODES.has(webhook.webhook_code) ? { borderColor: 'rgba(45, 155, 131, 0.6)' } : undefined}
                >
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
          ) : (
            <div className="webhook-placeholder">
              <pre className="code-block">
                <code>... waiting for CASH_FLOW_UPDATES webhooks</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {!allowManualPaste && (
        <div className="modal-button-row single-button" style={{ marginTop: 14 }}>
          <ArrowButton variant="blue" disabled={!canForward} onClick={onForward} />
        </div>
      )}
    </div>
  );
}

