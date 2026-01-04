import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatCurrency } from '../../services/financialService';

const ExpenseTimeline = ({ history, darkMode, translations }) => {
  const t = (key) => translations[key] || key;

  if (!history || history.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('expense_timeline')}
        </h3>
        <div className="text-center py-8">
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('no_historical_data') || 'Noch keine historischen Daten verfügbar'}
          </p>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {t('historical_data_info') || 'Daten werden ab dem nächsten Monat gesammelt'}
          </p>
        </div>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = history.map(snapshot => ({
    month: snapshot.month,
    monthLabel: format(new Date(snapshot.month + '-01'), 'MMM yy', { locale: de }),
    monthly: snapshot.totalMonthly,
    annual: snapshot.totalAnnual
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-3`}>
          <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {label}
          </p>
          <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {t('monthly_cost')}: {formatCurrency(payload[0].value)}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('annual_cost')}: {formatCurrency(payload[0].payload.annual)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate min and max for Y-axis with some padding
  const values = chartData.map(d => d.monthly);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 100;
  const yAxisDomain = [
    Math.floor((minValue - padding) / 100) * 100,
    Math.ceil((maxValue + padding) / 100) * 100
  ];

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('expense_timeline')}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('monthly_cost')}
            </span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey="monthLabel"
              stroke={darkMode ? '#9CA3AF' : '#6B7280'}
              style={{
                fontSize: '12px',
                fill: darkMode ? '#9CA3AF' : '#6B7280'
              }}
            />
            <YAxis
              domain={yAxisDomain}
              stroke={darkMode ? '#9CA3AF' : '#6B7280'}
              style={{
                fontSize: '12px',
                fill: darkMode ? '#9CA3AF' : '#6B7280'
              }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="monthly"
              stroke="#10B981"
              strokeWidth={3}
              dot={{
                fill: '#10B981',
                strokeWidth: 2,
                r: 4,
                stroke: darkMode ? '#1F2937' : '#fff'
              }}
              activeDot={{
                r: 6,
                stroke: '#10B981',
                strokeWidth: 2,
                fill: darkMode ? '#1F2937' : '#fff'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} grid grid-cols-3 gap-4`}>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('average')}
          </div>
          <div className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(values.reduce((a, b) => a + b, 0) / values.length)}
          </div>
        </div>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('lowest')}
          </div>
          <div className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(minValue)}
          </div>
        </div>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('highest')}
          </div>
          <div className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(maxValue)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTimeline;
