import React from 'react';

interface EnrichVisualizationProps {
  data: any;
}

interface NormalizedTransaction {
  id: string;
  description: string;
  amount: number;
  direction: 'INFLOW' | 'OUTFLOW' | string;
  isoCurrencyCode: string;
  merchantName?: string;
  logoUrl?: string;
  website?: string;
  primaryCategory?: string;
  detailedCategory?: string;
  categoryIconUrl?: string;
  paymentChannel?: string;
  city?: string;
  region?: string;
  counterpartyType?: string;
}

const prettifyCategory = (raw?: string): string => {
  if (!raw) return '';
  return raw
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const buildInitials = (name: string): string => {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || trimmed.charAt(0).toUpperCase();
};

const normalizeTransactions = (data: any): NormalizedTransaction[] => {
  const list = Array.isArray(data?.enriched_transactions) ? data.enriched_transactions : [];
  return list.map((tx: any): NormalizedTransaction => {
    const enrichments = tx?.enrichments ?? {};
    const counterparties = Array.isArray(enrichments?.counterparties) ? enrichments.counterparties : [];
    const primaryCounterparty = counterparties.find((c: any) => c?.type === 'merchant') ?? counterparties[0];
    const location = enrichments?.location ?? {};
    return {
      id: String(tx?.id ?? ''),
      description: String(tx?.description ?? ''),
      amount: typeof tx?.amount === 'number' ? tx.amount : Number(tx?.amount) || 0,
      direction: tx?.direction ?? 'OUTFLOW',
      isoCurrencyCode: tx?.iso_currency_code ?? 'USD',
      merchantName: enrichments?.merchant_name ?? primaryCounterparty?.name ?? undefined,
      logoUrl: enrichments?.logo_url ?? primaryCounterparty?.logo_url ?? undefined,
      website: enrichments?.website ?? primaryCounterparty?.website ?? undefined,
      primaryCategory: enrichments?.personal_finance_category?.primary ?? undefined,
      detailedCategory: enrichments?.personal_finance_category?.detailed ?? undefined,
      categoryIconUrl: enrichments?.personal_finance_category_icon_url ?? undefined,
      paymentChannel: enrichments?.payment_channel ?? undefined,
      city: location?.city ?? undefined,
      region: location?.region ?? undefined,
      counterpartyType: primaryCounterparty?.type ?? undefined,
    };
  });
};

const EnrichVisualization: React.FC<EnrichVisualizationProps> = ({ data }) => {
  const transactions = normalizeTransactions(data);

  if (transactions.length === 0) {
    return (
      <div className="viz-empty-state">
        <p>No enriched transactions to visualize.</p>
      </div>
    );
  }

  const totalInflow = transactions
    .filter((t) => t.direction === 'INFLOW')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = transactions
    .filter((t) => t.direction === 'OUTFLOW')
    .reduce((sum, t) => sum + t.amount, 0);
  const currency = transactions[0]?.isoCurrencyCode || 'USD';

  return (
    <div className="enrich-visualization">
      <div className="viz-summary-cards">
        <div className="viz-card">
          <div className="viz-card-label">Transactions</div>
          <div className="viz-card-value">{transactions.length}</div>
        </div>
        <div className="viz-card">
          <div className="viz-card-label">Credits</div>
          <div className="viz-card-value enrich-amount-inflow">
            {formatCurrency(totalInflow, currency)}
          </div>
        </div>
        <div className="viz-card">
          <div className="viz-card-label">Debits</div>
          <div className="viz-card-value enrich-amount-outflow">
            {formatCurrency(totalOutflow, currency)}
          </div>
        </div>
      </div>

      <div className="enrich-ledger">
        {transactions.map((tx) => {
          const isInflow = tx.direction === 'INFLOW';
          const amountClass = isInflow ? 'enrich-amount-inflow' : 'enrich-amount-outflow';
          const amountSign = isInflow ? '+' : '−';
          const merchantDisplay = tx.merchantName || tx.description || 'Unknown';
          const locationLabel = [tx.city, tx.region].filter(Boolean).join(', ');

          return (
            <div className="enrich-ledger-row" key={tx.id || tx.description}>
              <div className="enrich-ledger-logo">
                {tx.logoUrl ? (
                  <img
                    src={tx.logoUrl}
                    alt={`${merchantDisplay} logo`}
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = 'none';
                      const fallback = img.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="enrich-ledger-logo-fallback"
                  style={{ display: tx.logoUrl ? 'none' : 'flex' }}
                  aria-hidden="true"
                >
                  {buildInitials(merchantDisplay)}
                </div>
              </div>

              <div className="enrich-ledger-main">
                <div className="enrich-ledger-merchant">{merchantDisplay}</div>
                <div className="enrich-ledger-description" title={tx.description}>
                  {tx.description}
                </div>
                <div className="enrich-ledger-meta">
                  {tx.primaryCategory && (
                    <span className="enrich-ledger-tag enrich-ledger-tag--category">
                      {tx.categoryIconUrl && (
                        <img
                          src={tx.categoryIconUrl}
                          alt=""
                          className="enrich-ledger-tag-icon"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      {prettifyCategory(tx.primaryCategory)}
                    </span>
                  )}
                  {tx.paymentChannel && (
                    <span className="enrich-ledger-tag">{prettifyCategory(tx.paymentChannel)}</span>
                  )}
                  {locationLabel && (
                    <span className="enrich-ledger-tag enrich-ledger-tag--location">
                      {locationLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className={`enrich-ledger-amount ${amountClass}`}>
                <div className="enrich-ledger-amount-value">
                  {amountSign}
                  {formatCurrency(tx.amount, tx.isoCurrencyCode).replace(/^[-+]?/, '')}
                </div>
                <div className="enrich-ledger-amount-currency">{tx.isoCurrencyCode}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnrichVisualization;
