import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, X, Save } from 'lucide-react';
import { getBudget, saveBudget, checkBudgetStatus } from '../../services/budgetService';
import { formatCurrency } from '../../services/financialService';

const BudgetPlanner = ({ currentSpending, userId, darkMode, translations }) => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [annualLimit, setAnnualLimit] = useState('');
  const [alerts, setAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = (key) => translations[key] || key;

  useEffect(() => {
    loadBudget();
  }, [userId]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const userBudget = await getBudget(userId);
      setBudget(userBudget);
      if (userBudget) {
        setMonthlyLimit(userBudget.monthlyLimit.toString());
        setAnnualLimit(userBudget.annualLimit.toString());
        setAlerts(userBudget.alerts);
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      setSaving(true);

      if (!userId) {
        alert('User ID fehlt. Bitte neu einloggen.');
        return;
      }

      const budgetData = {
        monthlyLimit: parseFloat(monthlyLimit) || 0,
        annualLimit: parseFloat(annualLimit) || 0,
        alerts: alerts
      };

      console.log('Saving budget for user:', userId, budgetData);
      await saveBudget(userId, budgetData);
      await loadBudget();
      setShowEditModal(false);
      alert(t('budget_saved') || 'Budget erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error saving budget:', error);
      console.error('Error details:', error.message, error.code);
      alert(`${t('budget_save_error') || 'Fehler beim Speichern des Budgets'}\n\nDetails: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = () => {
    if (budget) {
      setMonthlyLimit(budget.monthlyLimit.toString());
      setAnnualLimit(budget.annualLimit.toString());
      setAlerts(budget.alerts);
    } else {
      setMonthlyLimit('');
      setAnnualLimit('');
      setAlerts(true);
    }
    setShowEditModal(true);
  };

  const budgetStatus = budget ? checkBudgetStatus(currentSpending, budget) : { hasLimit: false };

  const getStatusColor = (status) => {
    const colors = {
      ok: darkMode ? 'text-green-400 bg-green-900' : 'text-green-700 bg-green-100',
      caution: darkMode ? 'text-yellow-400 bg-yellow-900' : 'text-yellow-700 bg-yellow-100',
      warning: darkMode ? 'text-orange-400 bg-orange-900' : 'text-orange-700 bg-orange-100',
      exceeded: darkMode ? 'text-red-400 bg-red-900' : 'text-red-700 bg-red-100'
    };
    return colors[status] || colors.ok;
  };

  const getProgressColor = (status) => {
    const colors = {
      ok: 'bg-green-500',
      caution: 'bg-yellow-500',
      warning: 'bg-orange-500',
      exceeded: 'bg-red-500'
    };
    return colors[status] || colors.ok;
  };

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <div className="animate-pulse">
          <div className={`h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3 mb-4`} />
          <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full mb-2`} />
          <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/3`} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('budget_planner')}
          </h3>
          <button
            onClick={handleOpenEdit}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {!budgetStatus.hasLimit ? (
          <div className="text-center py-8">
            <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('no_budget_set') || 'Kein Budget festgelegt'}
            </p>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('no_budget_desc') || 'Lege ein monatliches Budget fest, um deine Ausgaben zu überwachen'}
            </p>
            <button
              onClick={handleOpenEdit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('set_budget') || 'Budget festlegen'}
            </button>
          </div>
        ) : (
          <>
            {/* Current Spending */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('current_spending') || 'Aktuelle Ausgaben'}
                </span>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(currentSpending)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('monthly_limit') || 'Monatliches Limit'}
                </span>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(budget.monthlyLimit)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className={`w-full h-4 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-full transition-all duration-500 ${getProgressColor(budgetStatus.status)}`}
                  style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {budgetStatus.percentage.toFixed(1)}% {t('used') || 'verwendet'}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {budgetStatus.remaining > 0
                    ? `${formatCurrency(budgetStatus.remaining)} ${t('remaining') || 'übrig'}`
                    : t('budget_exceeded') || 'Budget überschritten'}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`p-3 rounded-lg flex items-center gap-3 ${getStatusColor(budgetStatus.status)}`}>
              {budgetStatus.status === 'ok' && <CheckCircle className="w-5 h-5" />}
              {budgetStatus.status !== 'ok' && <AlertCircle className="w-5 h-5" />}
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {budgetStatus.status === 'ok' && (t('budget_ok') || 'Budget eingehalten')}
                  {budgetStatus.status === 'caution' && (t('budget_caution') || 'Nähert sich dem Limit')}
                  {budgetStatus.status === 'warning' && (t('budget_warning') || 'Vorsicht: 90% erreicht')}
                  {budgetStatus.status === 'exceeded' && (t('budget_exceeded_msg') || 'Budget überschritten!')}
                </p>
              </div>
            </div>

            {/* Annual Overview */}
            {budget.annualLimit > 0 && (
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('annual_limit') || 'Jährliches Limit'}
                  </span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(budget.annualLimit)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Budget Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {budget ? (t('edit_budget') || 'Budget bearbeiten') : (t('set_budget') || 'Budget festlegen')}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('monthly_limit') || 'Monatliches Limit'} (CHF) *
                </label>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="z.B. 500"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('annual_limit') || 'Jährliches Limit'} (CHF)
                </label>
                <input
                  type="number"
                  value={annualLimit}
                  onChange={(e) => setAnnualLimit(e.target.value)}
                  placeholder="z.B. 6000"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="alerts"
                  checked={alerts}
                  onChange={(e) => setAlerts(e.target.checked)}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="alerts"
                  className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {t('enable_alerts') || 'Benachrichtigungen aktivieren'}
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('cancel') || 'Abbrechen'}
                </button>
                <button
                  onClick={handleSaveBudget}
                  disabled={saving || !monthlyLimit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? (t('saving') || 'Speichern...') : (t('save') || 'Speichern')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetPlanner;
