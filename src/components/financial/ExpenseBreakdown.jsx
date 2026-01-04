import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getCategoryBreakdown, formatCurrency } from '../../services/financialService';

const ExpenseBreakdown = ({ snapshot, darkMode, translations }) => {
  if (!snapshot || !snapshot.byCategory || Object.keys(snapshot.byCategory).length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {translations.expense_breakdown || 'Kostenverteilung'}
        </h3>
        <div className="text-center py-8">
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {translations.no_data || 'Keine Daten verfügbar'}
          </p>
        </div>
      </div>
    );
  }

  const t = (key) => translations[key] || key;
  const breakdown = getCategoryBreakdown(snapshot);

  // Prepare data for Recharts
  const chartData = breakdown.map(item => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage
  }));

  // Custom label for pie slices
  const renderLabel = (entry) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-3`}>
          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {data.name}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {formatCurrency(data.value)}
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry, index) => {
          const item = breakdown[index];
          return (
            <div key={`legend-${index}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {entry.value}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(item.value)}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} w-12 text-right`}>
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {t('expense_breakdown')}
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={breakdown[index].color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      {renderLegend({ payload: chartData.map((item, idx) => ({
        value: item.name,
        color: breakdown[idx].color
      }))})}

      {/* Total */}
      <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('total')}
          </span>
          <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(snapshot.totalAnnual)}
          </span>
        </div>
        <div className={`text-xs mt-1 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('per_year')}
        </div>
      </div>
    </div>
  );
};

export default ExpenseBreakdown;
