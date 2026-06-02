import React, { useState } from 'react';

interface EnrichVisualizationProps {
  data: any;
}

interface NormalizedCounterparty {
  name: string;
  type?: string;
  logoUrl?: string;
  website?: string;
  entityId?: string;
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
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  storeNumber?: string;
  lat?: number;
  lon?: number;
  counterparties: NormalizedCounterparty[];
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

const finiteOrUndefined = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

const normalizeTransactions = (data: any): NormalizedTransaction[] => {
  const list = Array.isArray(data?.enriched_transactions) ? data.enriched_transactions : [];
  return list.map((tx: any): NormalizedTransaction => {
    const enrichments = tx?.enrichments ?? {};
    const counterpartiesRaw = Array.isArray(enrichments?.counterparties)
      ? enrichments.counterparties
      : [];
    const counterparties: NormalizedCounterparty[] = counterpartiesRaw
      .filter((c: any) => c && (c.name || c.entity_id))
      .map((c: any) => ({
        name: String(c?.name ?? ''),
        type: c?.type ?? undefined,
        logoUrl: c?.logo_url ?? undefined,
        website: c?.website ?? undefined,
        entityId: c?.entity_id ?? undefined,
      }));
    const primaryCounterparty =
      counterparties.find((c) => c.type === 'merchant') ?? counterparties[0];
    const location = enrichments?.location ?? {};
    return {
      id: String(tx?.id ?? ''),
      description: String(tx?.description ?? ''),
      amount: typeof tx?.amount === 'number' ? tx.amount : Number(tx?.amount) || 0,
      direction: tx?.direction ?? 'OUTFLOW',
      isoCurrencyCode: tx?.iso_currency_code ?? 'USD',
      merchantName: enrichments?.merchant_name ?? primaryCounterparty?.name ?? undefined,
      logoUrl: enrichments?.logo_url ?? primaryCounterparty?.logoUrl ?? undefined,
      website: enrichments?.website ?? primaryCounterparty?.website ?? undefined,
      primaryCategory: enrichments?.personal_finance_category?.primary ?? undefined,
      detailedCategory: enrichments?.personal_finance_category?.detailed ?? undefined,
      categoryIconUrl: enrichments?.personal_finance_category_icon_url ?? undefined,
      paymentChannel: enrichments?.payment_channel ?? undefined,
      address: location?.address ?? undefined,
      city: location?.city ?? undefined,
      region: location?.region ?? undefined,
      postalCode: location?.postal_code ?? undefined,
      country: location?.country ?? undefined,
      storeNumber:
        location?.store_number != null ? String(location.store_number) : undefined,
      lat: finiteOrUndefined(location?.lat),
      lon: finiteOrUndefined(location?.lon),
      counterparties,
    };
  });
};

const Logo: React.FC<{
  url?: string;
  alt: string;
  fallbackText: string;
  className: string;
  fallbackClassName: string;
}> = ({ url, alt, fallbackText, className, fallbackClassName }) => (
  <div className={className}>
    {url ? (
      <img
        src={url}
        alt={alt}
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = 'none';
          const fallback = img.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
    ) : null}
    <div
      className={fallbackClassName}
      style={{ display: url ? 'none' : 'flex' }}
      aria-hidden="true"
    >
      {fallbackText}
    </div>
  </div>
);

const ChevronLeftIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const TransactionDetail: React.FC<{
  tx: NormalizedTransaction;
  onBack: () => void;
}> = ({ tx, onBack }) => {
  const isInflow = tx.direction === 'INFLOW';
  const amountClass = isInflow ? 'enrich-amount-inflow' : 'enrich-amount-outflow';
  const amountSign = isInflow ? '+' : '−';
  const merchantDisplay = tx.merchantName || tx.description || 'Unknown';
  const locationLabel = [tx.city, tx.region].filter(Boolean).join(', ');

  // Only render the mini-map when we have a fully-formed location: both
  // coordinates AND every descriptive address field. Partial data (e.g. only
  // city/region, or lat/lon with no street address) is suppressed so we never
  // pin a map at a generic centroid that could mislead the user.
  const hasFullLocation =
    tx.lat !== undefined &&
    tx.lon !== undefined &&
    !!tx.address &&
    !!tx.city &&
    !!tx.region &&
    !!tx.country &&
    !!tx.postalCode;
  let mapEmbedUrl: string | null = null;
  let mapLinkUrl: string | null = null;
  if (hasFullLocation) {
    const lat = clamp(tx.lat as number, -85, 85);
    const lon = clamp(tx.lon as number, -180, 180);
    const delta = 0.005;
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
    mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox,
    )}&layer=mapnik&marker=${lat},${lon}`;
    mapLinkUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  }

  const detailRows: { label: string; value: React.ReactNode; mono?: boolean }[] = [];
  if (tx.address) detailRows.push({ label: 'Address', value: tx.address });
  if (locationLabel) detailRows.push({ label: 'City / Region', value: locationLabel });
  if (tx.postalCode) detailRows.push({ label: 'Postal code', value: tx.postalCode });
  if (tx.country) detailRows.push({ label: 'Country', value: tx.country });
  if (tx.storeNumber) detailRows.push({ label: 'Store number', value: tx.storeNumber });
  if (tx.website) {
    detailRows.push({
      label: 'Website',
      value: (
        <a
          href={`https://${tx.website.replace(/^https?:\/\//, '')}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {tx.website}
        </a>
      ),
    });
  }
  if (tx.paymentChannel) {
    detailRows.push({ label: 'Payment channel', value: prettifyCategory(tx.paymentChannel) });
  }
  if (tx.primaryCategory) {
    detailRows.push({
      label: 'Category',
      value: (
        <span className="enrich-detail-category-value">
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
          {tx.detailedCategory && tx.detailedCategory !== tx.primaryCategory && (
            <span className="enrich-detail-category-detailed">
              {prettifyCategory(tx.detailedCategory)}
            </span>
          )}
        </span>
      ),
    });
  }
  detailRows.push({ label: 'Description', value: tx.description, mono: true });
  if (tx.id) detailRows.push({ label: 'Transaction ID', value: tx.id, mono: true });

  return (
    <div className="enrich-detail">
      <button type="button" className="enrich-detail-back" onClick={onBack}>
        <ChevronLeftIcon />
        <span>Back to list</span>
      </button>

      <div className="enrich-detail-hero">
        <Logo
          url={tx.logoUrl}
          alt={`${merchantDisplay} logo`}
          fallbackText={buildInitials(merchantDisplay)}
          className="enrich-detail-logo"
          fallbackClassName="enrich-ledger-logo-fallback"
        />
        <div className="enrich-detail-hero-main">
          <div className="enrich-detail-merchant">{merchantDisplay}</div>
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
        <div className={`enrich-detail-amount ${amountClass}`}>
          <div className="enrich-detail-amount-value">
            {amountSign}
            {formatCurrency(tx.amount, tx.isoCurrencyCode).replace(/^[-+]?/, '')}
          </div>
          <div className="enrich-ledger-amount-currency">{tx.isoCurrencyCode}</div>
        </div>
      </div>

      {mapEmbedUrl && (
        <div className="enrich-detail-map-block">
          <div className="enrich-detail-map">
            <iframe src={mapEmbedUrl} title="Merchant location map" loading="lazy" />
          </div>
          {mapLinkUrl && (
            <a
              className="enrich-detail-map-link"
              href={mapLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View larger map
            </a>
          )}
        </div>
      )}

      <div className="enrich-detail-grid">
        {detailRows.map((row) => (
          <div className="enrich-detail-row" key={row.label}>
            <div className="enrich-detail-label">{row.label}</div>
            <div
              className={`enrich-detail-value${row.mono ? ' enrich-detail-value--mono' : ''}`}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>

      {tx.counterparties.length > 0 && (
        <div className="enrich-detail-counterparties">
          <div className="enrich-detail-section-title">Counterparties</div>
          {tx.counterparties.map((cp, idx) => (
            <div className="enrich-detail-counterparty" key={cp.entityId || `${cp.name}-${idx}`}>
              <Logo
                url={cp.logoUrl}
                alt={`${cp.name} logo`}
                fallbackText={buildInitials(cp.name)}
                className="enrich-detail-counterparty-logo"
                fallbackClassName="enrich-ledger-logo-fallback"
              />
              <div className="enrich-detail-counterparty-main">
                <div className="enrich-detail-counterparty-name">{cp.name}</div>
                {cp.website && (
                  <a
                    className="enrich-detail-counterparty-website"
                    href={`https://${cp.website.replace(/^https?:\/\//, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {cp.website}
                  </a>
                )}
              </div>
              {cp.type && (
                <span className="enrich-ledger-tag">{prettifyCategory(cp.type)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EnrichVisualization: React.FC<EnrichVisualizationProps> = ({ data }) => {
  const transactions = normalizeTransactions(data);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="viz-empty-state">
        <p>No enriched transactions to visualize.</p>
      </div>
    );
  }

  const selected = selectedId ? transactions.find((t) => t.id === selectedId) ?? null : null;
  if (selected) {
    return (
      <div className="enrich-visualization">
        <TransactionDetail tx={selected} onBack={() => setSelectedId(null)} />
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
          <div className="viz-card-sublabel">Enriched</div>
        </div>
        <div className="viz-card">
          <div className="viz-card-label">Total Inflow</div>
          <div className="viz-card-value enrich-amount-inflow">
            {formatCurrency(totalInflow, currency)}
          </div>
          <div className="viz-card-sublabel">Credits</div>
        </div>
        <div className="viz-card">
          <div className="viz-card-label">Total Outflow</div>
          <div className="viz-card-value enrich-amount-outflow">
            {formatCurrency(totalOutflow, currency)}
          </div>
          <div className="viz-card-sublabel">Debits</div>
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
            <button
              type="button"
              className="enrich-ledger-row"
              key={tx.id || tx.description}
              onClick={() => setSelectedId(tx.id)}
              aria-label={`View details for ${merchantDisplay}`}
            >
              <Logo
                url={tx.logoUrl}
                alt={`${merchantDisplay} logo`}
                fallbackText={buildInitials(merchantDisplay)}
                className="enrich-ledger-logo"
                fallbackClassName="enrich-ledger-logo-fallback"
              />

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
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EnrichVisualization;
