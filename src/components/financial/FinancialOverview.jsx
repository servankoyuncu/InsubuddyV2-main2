import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, FileText } from 'lucide-react';
import { formatCurrency } from '../../services/financialService';

const FinancialOverview = ({ snapshot, trend, darkMode, translations }) => {
  if (!snapshot) {
    return null;
  }

  const t = (key) => translations[key] || key;

  const getTrendIcon = () => {
    if (trend.direction === 'up') return <TrendingUp className="w-5 h-5" />;
    if (trend.direction === 'down') return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const getTrendColor = () => {
    if (trend.direction === 'up') return 'text-red-600 bg-red-100';
    if (trend.direction === 'down') return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Monthly Cost Card */}
      <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} p-6 rounded-lg border ${darkMode ? 'border-green-800' : 'border-green-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('monthly_cost')}
          </div>
          <DollarSign className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
        </div>
        <div className={`text-3xl font-bold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
          {formatCurrency(snapshot.totalMonthly)}
        </div>
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {t('per_month')}
        </div>
      </div>

      {/* Annual Cost Card */}
      <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} p-6 rounded-lg border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('annual_cost')}
          </div>
          <FileText className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div className={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
          {formatCurrency(snapshot.totalAnnual)}
        </div>
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {t('per_year')}
        </div>
      </div>

      {/* Active Policies Card */}
      <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-50'} p-6 rounded-lg border ${darkMode ? 'border-purple-800' : 'border-purple-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('active_policies')}
          </div>
          <FileText className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
        <div className={`text-3xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
          {snapshot.policyCount}
        </div>
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {t('policies_tracked')}
        </div>
      </div>

      {/* Trend Card */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('trend')}
          </div>
          {getTrendIcon()}
        </div>
        {trend.direction === 'neutral' || trend.percentage === 0 ? (
          <div className={`text-lg font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('no_change')}
          </div>
        ) : (
          <>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {trend.percentage.toFixed(1)}%
            </div>
            <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {formatCurrency(trend.amount)}
            </div>
          </>
        )}
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {t('vs_last_month')}
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;
