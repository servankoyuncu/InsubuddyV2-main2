import React from 'react';
import { TrendingDown, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '../../services/financialService';

const SavingsOpportunities = ({ recommendations, darkMode, translations }) => {
  const t = (key) => translations[key] || key;

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('savings_opportunities')}
        </h3>
        <div className="text-center py-8">
          <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('all_optimal') || 'Alle deine Policen sind optimal!'}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('all_optimal_desc') || 'Deine Versicherungsprämien liegen im Marktdurchschnitt oder darunter.'}
          </p>
        </div>
      </div>
    );
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: {
        text: t('high_priority') || 'Hohe Ersparnis',
        className: 'bg-red-100 text-red-700',
        darkClassName: 'bg-red-900 text-red-300'
      },
      medium: {
        text: t('medium_priority') || 'Mittlere Ersparnis',
        className: 'bg-orange-100 text-orange-700',
        darkClassName: 'bg-orange-900 text-orange-300'
      },
      low: {
        text: t('low_priority') || 'Kleine Ersparnis',
        className: 'bg-yellow-100 text-yellow-700',
        darkClassName: 'bg-yellow-900 text-yellow-300'
      }
    };

    const badge = badges[priority] || badges.low;
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? badge.darkClassName : badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const totalSavings = recommendations.reduce((sum, rec) => sum + rec.savingsAmount, 0);

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('savings_opportunities')}
        </h3>
        <div className="flex items-center gap-2">
          <TrendingDown className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <span className={`text-sm font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {t('potential_savings') || 'Potenzial'}: {formatCurrency(totalSavings)}/{t('year') || 'Jahr'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {rec.policyName}
                  </h4>
                  {getPriorityBadge(rec.priority)}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {rec.company} • {rec.category}
                </p>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg mb-3 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('current_premium') || 'Aktuelle Prämie'}
                </div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(rec.currentPremium)}
                </div>
              </div>
              <div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('market_average') || 'Marktdurchschnitt'}
                </div>
                <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {formatCurrency(rec.recommendedPremium)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {rec.reason}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('potential_savings') || 'Einsparpotenzial'}
                </div>
                <div className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {formatCurrency(rec.savingsAmount)}
                </div>
                <div className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                  ({rec.savingsPercentage}%)
                </div>
              </div>
            </div>

            {/* Placeholder for future marketplace integration */}
            <div className="mt-3 pt-3 border-t border-gray-600">
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-green-900 text-green-300 hover:bg-green-800'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
                onClick={() => alert(t('marketplace_coming_soon') || 'Marketplace wird bald verfügbar sein!')}
              >
                {t('view_alternatives') || 'Alternativen anzeigen'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('total_savings_potential') || 'Gesamtes Einsparpotenzial'}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {formatCurrency(totalSavings)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('per_year') || 'pro Jahr'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsOpportunities;
