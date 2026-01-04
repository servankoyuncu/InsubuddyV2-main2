import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  calculateCurrentSnapshot,
  getFinancialHistory,
  calculateTrend,
  generateSavingsRecommendations,
  saveFinancialSnapshot
} from '../services/financialService';
import FinancialOverview from './financial/FinancialOverview';
import ExpenseBreakdown from './financial/ExpenseBreakdown';
import ExpenseTimeline from './financial/ExpenseTimeline';
import SavingsOpportunities from './financial/SavingsOpportunities';
import BudgetPlanner from './financial/BudgetPlanner';

const FinancialDashboard = ({ policies, darkMode, language, currentUser }) => {
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState({ percentage: 0, direction: 'neutral', amount: 0 });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Translations
  const translations = {
    de: {
      financial_overview: 'Finanzielle Übersicht',
      financial_subtitle: 'Behalte deine Versicherungskosten im Blick',
      monthly_cost: 'Monatliche Kosten',
      annual_cost: 'Jährliche Kosten',
      active_policies: 'Aktive Policen',
      trend: 'Trend',
      per_month: 'pro Monat',
      per_year: 'pro Jahr',
      policies_tracked: 'Policen verwaltet',
      no_change: 'Keine Änderung',
      vs_last_month: 'vs. letzter Monat',
      expense_breakdown: 'Kostenverteilung',
      savings_opportunities: 'Einsparpotenzial',
      budget_planner: 'Budget-Planer',
      expense_timeline: 'Kostenverlauf',
      no_data: 'Keine Daten verfügbar',
      no_historical_data: 'Noch keine historischen Daten verfügbar',
      historical_data_info: 'Daten werden ab dem nächsten Monat gesammelt',
      total: 'Gesamt',
      average: 'Durchschnitt',
      lowest: 'Niedrigster',
      highest: 'Höchster',
      all_optimal: 'Alle deine Policen sind optimal!',
      all_optimal_desc: 'Deine Versicherungsprämien liegen im Marktdurchschnitt oder darunter.',
      high_priority: 'Hohe Ersparnis',
      medium_priority: 'Mittlere Ersparnis',
      low_priority: 'Kleine Ersparnis',
      current_premium: 'Aktuelle Prämie',
      market_average: 'Marktdurchschnitt',
      potential_savings: 'Einsparpotenzial',
      view_alternatives: 'Alternativen anzeigen',
      marketplace_coming_soon: 'Marketplace wird bald verfügbar sein!',
      total_savings_potential: 'Gesamtes Einsparpotenzial',
      year: 'Jahr',
      no_budget_set: 'Kein Budget festgelegt',
      no_budget_desc: 'Lege ein monatliches Budget fest, um deine Ausgaben zu überwachen',
      set_budget: 'Budget festlegen',
      current_spending: 'Aktuelle Ausgaben',
      monthly_limit: 'Monatliches Limit',
      annual_limit: 'Jährliches Limit',
      used: 'verwendet',
      remaining: 'übrig',
      budget_exceeded: 'Budget überschritten',
      budget_ok: 'Budget eingehalten',
      budget_caution: 'Nähert sich dem Limit',
      budget_warning: 'Vorsicht: 90% erreicht',
      budget_exceeded_msg: 'Budget überschritten!',
      edit_budget: 'Budget bearbeiten',
      enable_alerts: 'Benachrichtigungen aktivieren',
      cancel: 'Abbrechen',
      save: 'Speichern',
      saving: 'Speichern...',
      budget_saved: 'Budget erfolgreich gespeichert!',
      budget_save_error: 'Fehler beim Speichern des Budgets',
      no_policies: 'Keine Policen vorhanden',
      no_policies_desc: 'Füge zuerst Versicherungspolicen hinzu, um deine Finanzen zu analysieren.',
      go_to_policies: 'Zu Policen'
    },
    en: {
      financial_overview: 'Financial Overview',
      financial_subtitle: 'Keep track of your insurance costs',
      monthly_cost: 'Monthly Cost',
      annual_cost: 'Annual Cost',
      active_policies: 'Active Policies',
      trend: 'Trend',
      per_month: 'per month',
      per_year: 'per year',
      policies_tracked: 'policies tracked',
      no_change: 'No change',
      vs_last_month: 'vs. last month',
      expense_breakdown: 'Expense Breakdown',
      savings_opportunities: 'Savings Opportunities',
      budget_planner: 'Budget Planner',
      expense_timeline: 'Expense Timeline',
      no_data: 'No data available',
      no_historical_data: 'No historical data available yet',
      historical_data_info: 'Data will be collected starting next month',
      total: 'Total',
      average: 'Average',
      lowest: 'Lowest',
      highest: 'Highest',
      all_optimal: 'All your policies are optimal!',
      all_optimal_desc: 'Your insurance premiums are at or below market average.',
      high_priority: 'High Savings',
      medium_priority: 'Medium Savings',
      low_priority: 'Low Savings',
      current_premium: 'Current Premium',
      market_average: 'Market Average',
      potential_savings: 'Potential Savings',
      view_alternatives: 'View Alternatives',
      marketplace_coming_soon: 'Marketplace coming soon!',
      total_savings_potential: 'Total Savings Potential',
      year: 'year',
      no_budget_set: 'No Budget Set',
      no_budget_desc: 'Set a monthly budget to monitor your expenses',
      set_budget: 'Set Budget',
      current_spending: 'Current Spending',
      monthly_limit: 'Monthly Limit',
      annual_limit: 'Annual Limit',
      used: 'used',
      remaining: 'remaining',
      budget_exceeded: 'Budget exceeded',
      budget_ok: 'Budget maintained',
      budget_caution: 'Approaching limit',
      budget_warning: 'Warning: 90% reached',
      budget_exceeded_msg: 'Budget exceeded!',
      edit_budget: 'Edit Budget',
      enable_alerts: 'Enable notifications',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      budget_saved: 'Budget saved successfully!',
      budget_save_error: 'Error saving budget',
      no_policies: 'No Policies',
      no_policies_desc: 'Add insurance policies first to analyze your finances.',
      go_to_policies: 'Go to Policies'
    }
  };

  const t = translations[language] || translations.de;

  useEffect(() => {
    loadFinancialData();
  }, [policies, currentUser]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      if (policies && policies.length > 0 && currentUser) {
        // Calculate current snapshot
        const currentSnapshot = calculateCurrentSnapshot(policies);
        setSnapshot(currentSnapshot);

        // Save snapshot to Firestore
        await saveFinancialSnapshot(currentUser.uid, policies);

        // Load historical data
        const historyData = await getFinancialHistory(currentUser.uid, 6);
        setHistory(historyData);

        // Calculate trend
        if (historyData.length > 0) {
          const trendData = calculateTrend(historyData);
          setTrend(trendData);
        }

        // Generate savings recommendations
        const recs = await generateSavingsRecommendations(currentUser.uid, policies);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Empty state if no policies
  if (!loading && (!policies || policies.length === 0)) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h2 className="text-2xl font-bold">{t.financial_overview}</h2>
          </div>
          <p className="text-sm opacity-90">{t.financial_subtitle}</p>
        </div>

        {/* Empty state */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-12 text-center`}>
          <TrendingUp className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t.no_policies}
          </h3>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t.no_policies_desc}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg animate-pulse">
          <div className="h-8 bg-green-400 rounded w-1/3 mb-2" />
          <div className="h-4 bg-green-400 rounded w-1/2" />
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 animate-pulse`}>
          <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full mb-2`} />
          <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/3`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8" />
          <h2 className="text-2xl font-bold">{t.financial_overview}</h2>
        </div>
        <p className="text-sm opacity-90">{t.financial_subtitle}</p>
      </div>

      {/* Overview Cards */}
      <FinancialOverview
        snapshot={snapshot}
        trend={trend}
        darkMode={darkMode}
        translations={t}
      />

      {/* Two-column grid: Breakdown & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseBreakdown
          snapshot={snapshot}
          darkMode={darkMode}
          translations={t}
        />
        <BudgetPlanner
          currentSpending={snapshot?.totalMonthly || 0}
          userId={currentUser?.uid}
          darkMode={darkMode}
          translations={t}
        />
      </div>

      {/* Timeline Chart */}
      <ExpenseTimeline
        history={history}
        darkMode={darkMode}
        translations={t}
      />

      {/* Savings Opportunities */}
      <SavingsOpportunities
        recommendations={recommendations}
        darkMode={darkMode}
        translations={t}
      />
    </div>
  );
};

export default FinancialDashboard;
