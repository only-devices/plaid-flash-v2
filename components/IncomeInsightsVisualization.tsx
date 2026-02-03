import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Cell,
} from 'recharts';

interface IncomeInsightsVisualizationProps {
  data: any;
}

interface MonthlyData {
  month: string;
  amount: number;
  transactionCount: number;
}

interface ComparisonData {
  label: string;
  value: number;
  type: 'historical' | 'forecasted';
}

const IncomeInsightsVisualization: React.FC<IncomeInsightsVisualizationProps> = ({ data }) => {
  // Parse the data structure
  const report = data?.report;
  const bankIncomeSummary = report?.bank_income_summary;
  const items = report?.items || [];
  
  if (!bankIncomeSummary) {
    return (
      <div className="viz-empty-state">
        <p>No income insights data available to visualize.</p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format month from date string
  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Extract monthly income data
  const monthlyData: MonthlyData[] = (bankIncomeSummary.historical_summary || [])
    .filter((item: any) => item.total_amounts && item.total_amounts.length > 0)
    .map((item: any) => ({
      month: formatMonth(item.end_date),
      amount: item.total_amounts[0].amount,
      transactionCount: item.transactions?.length || 0,
    }));

  // Extract comparison data
  const comparisonData: ComparisonData[] = [
    {
      label: 'Historical Annual',
      value: bankIncomeSummary.historical_annual_income?.[0]?.amount || 0,
      type: 'historical' as const,
    },
    {
      label: 'Forecasted Annual',
      value: bankIncomeSummary.forecasted_annual_income?.[0]?.amount || 0,
      type: 'forecasted' as const,
    },
    {
      label: 'Historical Monthly Avg',
      value: bankIncomeSummary.historical_average_monthly_income?.[0]?.amount || 0,
      type: 'historical' as const,
    },
    {
      label: 'Forecasted Monthly Avg',
      value: bankIncomeSummary.forecasted_average_monthly_income?.[0]?.amount || 0,
      type: 'forecasted' as const,
    },
    {
      label: 'Historical Annual Gross',
      value: bankIncomeSummary.historical_annual_gross_income?.[0]?.amount || 0,
      type: 'historical' as const,
    },
    {
      label: 'Historical Monthly Gross Avg',
      value: bankIncomeSummary.historical_average_monthly_gross_income?.[0]?.amount || 0,
      type: 'historical' as const,
    },
  ].filter(item => item.value > 0);

  // Extract summary metrics
  const currency = bankIncomeSummary.total_amounts?.[0]?.iso_currency_code || 'USD';
  const startDate = bankIncomeSummary.start_date;
  const endDate = bankIncomeSummary.end_date;
  const incomeSources = bankIncomeSummary.income_sources_count || 0;
  const transactionCount = bankIncomeSummary.income_transactions_count || 0;
  
  // Get pay frequency from first income source
  const payFrequency = items[0]?.bank_income_sources?.[0]?.pay_frequency || 'N/A';

  // Custom tooltip for monthly chart
  const MonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="viz-tooltip">
          <p className="tooltip-label">{payload[0].payload.month}</p>
          <p className="tooltip-value">
            Income: {formatCurrency(payload[0].value, currency)}
          </p>
          <p className="tooltip-transactions">
            Transactions: {payload[0].payload.transactionCount}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for comparison chart
  const ComparisonTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="viz-tooltip">
          <p className="tooltip-label">{payload[0].payload.label}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value, currency)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="income-insights-visualization">
      {/* Summary Cards */}
      <div className="viz-summary-cards">
        <div className="viz-card">
          <div className="viz-card-label">Total Income</div>
          <div className="viz-card-value">
            {formatCurrency(bankIncomeSummary.total_amounts?.[0]?.amount || 0, currency)}
          </div>
          <div className="viz-card-sublabel">
            {startDate && endDate && `${formatMonth(startDate)} - ${formatMonth(endDate)}`}
          </div>
        </div>
        <div className="viz-card">
          <div className="viz-card-label">Income Sources</div>
          <div className="viz-card-value">{incomeSources}</div>
          <div className="viz-card-sublabel">Active sources</div>
        </div>
        <div className="viz-card">
          <div className="viz-card-label">Transactions</div>
          <div className="viz-card-value">{transactionCount}</div>
          <div className="viz-card-sublabel">Income deposits</div>
        </div>
        <div className="viz-card">
          <div className="viz-card-label">Pay Frequency</div>
          <div className="viz-card-value">{payFrequency.toLowerCase().replace('_', ' ')}</div>
          <div className="viz-card-sublabel">Payment schedule</div>
        </div>
      </div>

      {/* Monthly Income Trend Chart */}
      {monthlyData.length > 0 && (
        <div className="viz-chart-container">
          <h3 className="viz-chart-title">Monthly Income Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d9b83" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2d9b83" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<MonthlyTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                fill="url(#colorIncome)"
                stroke="#2d9b83"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2d9b83"
                strokeWidth={3}
                dot={{ fill: '#2d9b83', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Income Comparison Chart */}
      {comparisonData.length > 0 && (
        <div className="viz-chart-container">
          <h3 className="viz-chart-title">Income Comparison</h3>
          <ResponsiveContainer width="100%" height={Math.max(250, comparisonData.length * 50)}>
            <BarChart 
              data={comparisonData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                type="number" 
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category" 
                dataKey="label" 
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
                width={110}
              />
              <Tooltip content={<ComparisonTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#2d9b83"
                radius={[0, 8, 8, 0]}
                maxBarSize={30}
              >
                {comparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.type === 'historical' ? '#2d9b83' : '#4ab19d'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="viz-legend">
            <div className="viz-legend-item">
              <span className="viz-legend-color" style={{ backgroundColor: '#2d9b83' }}></span>
              <span>Historical</span>
            </div>
            <div className="viz-legend-item">
              <span className="viz-legend-color" style={{ backgroundColor: '#4ab19d' }}></span>
              <span>Forecasted</span>
            </div>
          </div>
        </div>
      )}

      {/* Income Sources Details */}
      {items.length > 0 && items[0].bank_income_sources && (
        <div className="viz-chart-container">
          <h3 className="viz-chart-title">Income Sources</h3>
          {items[0].bank_income_sources.map((source: any, index: number) => (
            <div key={index} className="viz-income-source">
              <div className="viz-source-header">
                <div className="viz-source-name">{source.income_description || 'Income Source'}</div>
                <div className="viz-source-status" data-status={source.status?.toLowerCase()}>
                  {source.status}
                </div>
              </div>
              <div className="viz-source-details">
                <div className="viz-source-detail">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{source.income_category || 'N/A'}</span>
                </div>
                <div className="viz-source-detail">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value">
                    {formatCurrency(source.total_amount || 0, currency)}
                  </span>
                </div>
                <div className="viz-source-detail">
                  <span className="detail-label">Transactions:</span>
                  <span className="detail-value">{source.transaction_count || 0}</span>
                </div>
                <div className="viz-source-detail">
                  <span className="detail-label">Period:</span>
                  <span className="detail-value">
                    {source.start_date && source.end_date && 
                      `${formatMonth(source.start_date)} - ${formatMonth(source.end_date)}`}
                  </span>
                </div>
                {source.next_payment_date && (
                  <div className="viz-source-detail">
                    <span className="detail-label">Next Payment:</span>
                    <span className="detail-value">
                      {new Date(source.next_payment_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomeInsightsVisualization;
