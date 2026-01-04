import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Parse premium string (e.g., "CHF 450/Jahr", "CHF 45/Monat") to annual amount
 */
const parsePremiumToAnnual = (premiumString) => {
  if (!premiumString) return 0;

  // Extract number
  const match = premiumString.match(/[\d.,]+/);
  if (!match) return 0;

  const amount = parseFloat(match[0].replace(',', ''));

  // Check if monthly or annual
  if (premiumString.toLowerCase().includes('monat') || premiumString.toLowerCase().includes('month')) {
    return amount * 12;
  }

  return amount; // Already annual
};

/**
 * Calculate current financial snapshot from policies
 */
export const calculateCurrentSnapshot = (policies) => {
  const snapshot = {
    totalAnnual: 0,
    totalMonthly: 0,
    policyCount: policies.length,
    byCategory: {},
    byCompany: {},
  };

  policies.forEach(policy => {
    const annual = parsePremiumToAnnual(policy.premium);
    const monthly = annual / 12;

    snapshot.totalAnnual += annual;
    snapshot.totalMonthly += monthly;

    // By Category
    if (!snapshot.byCategory[policy.type]) {
      snapshot.byCategory[policy.type] = {
        annual: 0,
        monthly: 0,
        count: 0,
        percentage: 0
      };
    }
    snapshot.byCategory[policy.type].annual += annual;
    snapshot.byCategory[policy.type].monthly += monthly;
    snapshot.byCategory[policy.type].count += 1;

    // By Company
    if (!snapshot.byCompany[policy.company]) {
      snapshot.byCompany[policy.company] = {
        annual: 0,
        monthly: 0,
        count: 0
      };
    }
    snapshot.byCompany[policy.company].annual += annual;
    snapshot.byCompany[policy.company].monthly += monthly;
    snapshot.byCompany[policy.company].count += 1;
  });

  // Calculate percentages
  Object.keys(snapshot.byCategory).forEach(category => {
    snapshot.byCategory[category].percentage =
      (snapshot.byCategory[category].annual / snapshot.totalAnnual) * 100;
  });

  return snapshot;
};

/**
 * Save monthly financial snapshot to Firestore
 */
export const saveFinancialSnapshot = async (userId, policies) => {
  try {
    const snapshot = calculateCurrentSnapshot(policies);
    const month = format(new Date(), 'yyyy-MM');

    // Check if snapshot for this month already exists
    const snapshotsRef = collection(db, 'financialSnapshots');
    const q = query(
      snapshotsRef,
      where('userId', '==', userId),
      where('month', '==', month)
    );

    const existingSnapshots = await getDocs(q);

    if (existingSnapshots.empty) {
      // Create new snapshot
      await addDoc(snapshotsRef, {
        userId,
        month,
        totalAnnual: snapshot.totalAnnual,
        totalMonthly: snapshot.totalMonthly,
        byCategory: snapshot.byCategory,
        byCompany: snapshot.byCompany,
        policyCount: snapshot.policyCount,
        createdAt: Timestamp.now(),
      });
    } else {
      // Update existing snapshot
      const docRef = existingSnapshots.docs[0].ref;
      await updateDoc(docRef, {
        totalAnnual: snapshot.totalAnnual,
        totalMonthly: snapshot.totalMonthly,
        byCategory: snapshot.byCategory,
        byCompany: snapshot.byCompany,
        policyCount: snapshot.policyCount,
        updatedAt: Timestamp.now(),
      });
    }

    return snapshot;
  } catch (error) {
    console.error('Error saving financial snapshot:', error);
    throw error;
  }
};

/**
 * Get financial history for last N months
 */
export const getFinancialHistory = async (userId, months = 6) => {
  try {
    const snapshotsRef = collection(db, 'financialSnapshots');
    const q = query(
      snapshotsRef,
      where('userId', '==', userId),
      orderBy('month', 'desc'),
      limit(months)
    );

    const querySnapshot = await getDocs(q);
    const history = [];

    querySnapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Reverse to get chronological order
    return history.reverse();
  } catch (error) {
    console.error('Error getting financial history:', error);
    return [];
  }
};

/**
 * Calculate trend (increase/decrease) compared to previous month
 */
export const calculateTrend = (history) => {
  if (history.length < 2) {
    return { percentage: 0, direction: 'neutral' };
  }

  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  if (!previous.totalMonthly || previous.totalMonthly === 0) {
    return { percentage: 0, direction: 'neutral' };
  }

  const difference = current.totalMonthly - previous.totalMonthly;
  const percentage = (difference / previous.totalMonthly) * 100;

  return {
    percentage: Math.abs(percentage),
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
    amount: Math.abs(difference)
  };
};

/**
 * Get category breakdown with colors
 */
export const getCategoryBreakdown = (snapshot) => {
  const categoryColors = {
    'Hausrat': '#3B82F6', // Blue
    'Auto': '#EF4444', // Red
    'Haftpflicht': '#10B981', // Green
    'Krankenkasse': '#F59E0B', // Orange
    'Gebäude': '#8B5CF6', // Purple
    'Rechtsschutz': '#EC4899', // Pink
    'Reise': '#14B8A6', // Teal
  };

  const breakdown = Object.keys(snapshot.byCategory).map(category => ({
    name: category,
    value: snapshot.byCategory[category].annual,
    percentage: snapshot.byCategory[category].percentage,
    monthly: snapshot.byCategory[category].monthly,
    count: snapshot.byCategory[category].count,
    color: categoryColors[category] || '#6B7280'
  }));

  // Sort by value descending
  return breakdown.sort((a, b) => b.value - a.value);
};

/**
 * Generate savings recommendations based on market averages
 */
export const generateSavingsRecommendations = async (userId, policies) => {
  // Market averages (Swiss market data - these would ideally come from a DB)
  const marketAverages = {
    'Hausrat': 450,
    'Auto': 1200,
    'Haftpflicht': 300,
    'Krankenkasse': 4800,
    'Gebäude': 800,
    'Rechtsschutz': 250,
    'Reise': 150,
  };

  const recommendations = [];

  for (const policy of policies) {
    const annual = parsePremiumToAnnual(policy.premium);
    const average = marketAverages[policy.type];

    if (average && annual > average * 1.15) { // 15% above average
      const savingsAmount = annual - average;
      recommendations.push({
        policyId: policy.id,
        policyName: policy.name,
        company: policy.company,
        category: policy.type,
        currentPremium: annual,
        recommendedPremium: average,
        savingsAmount: savingsAmount,
        savingsPercentage: ((savingsAmount / annual) * 100).toFixed(1),
        reason: 'Diese Police liegt über dem Marktdurchschnitt',
        priority: savingsAmount > 500 ? 'high' : savingsAmount > 200 ? 'medium' : 'low'
      });
    }
  }

  // Sort by savings amount
  return recommendations.sort((a, b) => b.savingsAmount - a.savingsAmount);
};

/**
 * Format currency
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showDecimals = false,
    showCurrency = true
  } = options;

  const formatted = amount.toLocaleString('de-CH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  });

  return showCurrency ? `CHF ${formatted}` : formatted;
};

/**
 * Get financial summary stats
 */
export const getFinancialSummary = (snapshot, history) => {
  const trend = calculateTrend(history);

  return {
    totalMonthly: snapshot.totalMonthly,
    totalAnnual: snapshot.totalAnnual,
    policyCount: snapshot.policyCount,
    averagePerPolicy: snapshot.policyCount > 0 ? snapshot.totalAnnual / snapshot.policyCount : 0,
    trend: trend,
    topCategory: getCategoryBreakdown(snapshot)[0] || null,
  };
};
