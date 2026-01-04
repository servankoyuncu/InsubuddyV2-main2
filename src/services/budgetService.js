import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

/**
 * Get user's budget settings
 */
export const getBudget = async (userId) => {
  try {
    const budgetRef = doc(db, 'budgets', userId);
    const budgetDoc = await getDoc(budgetRef);

    if (budgetDoc.exists()) {
      return {
        id: budgetDoc.id,
        ...budgetDoc.data()
      };
    }

    // Return default budget if none exists
    return null;
  } catch (error) {
    console.error('Error getting budget:', error);
    throw error;
  }
};

/**
 * Save or update user's budget
 */
export const saveBudget = async (userId, budgetData) => {
  try {
    const budgetRef = doc(db, 'budgets', userId);
    const existingBudget = await getDoc(budgetRef);

    const budget = {
      userId,
      monthlyLimit: budgetData.monthlyLimit || 0,
      annualLimit: budgetData.annualLimit || 0,
      alerts: budgetData.alerts !== undefined ? budgetData.alerts : true,
      updatedAt: Timestamp.now()
    };

    if (existingBudget.exists()) {
      // Update existing budget
      await setDoc(budgetRef, budget, { merge: true });
    } else {
      // Create new budget
      budget.createdAt = Timestamp.now();
      await setDoc(budgetRef, budget);
    }

    return budget;
  } catch (error) {
    console.error('Error saving budget:', error);
    throw error;
  }
};

/**
 * Check budget status and calculate progress
 */
export const checkBudgetStatus = (currentSpending, budget) => {
  if (!budget || !budget.monthlyLimit) {
    return {
      hasLimit: false,
      percentage: 0,
      remaining: 0,
      status: 'no_limit'
    };
  }

  const percentage = (currentSpending / budget.monthlyLimit) * 100;
  const remaining = budget.monthlyLimit - currentSpending;

  let status = 'ok';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 90) {
    status = 'warning';
  } else if (percentage >= 75) {
    status = 'caution';
  }

  return {
    hasLimit: true,
    percentage: Math.min(percentage, 100),
    remaining: remaining,
    status: status,
    isOverBudget: currentSpending > budget.monthlyLimit
  };
};

/**
 * Calculate annual budget status
 */
export const checkAnnualBudgetStatus = (currentAnnualSpending, budget) => {
  if (!budget || !budget.annualLimit) {
    return {
      hasLimit: false,
      percentage: 0,
      remaining: 0,
      status: 'no_limit'
    };
  }

  const percentage = (currentAnnualSpending / budget.annualLimit) * 100;
  const remaining = budget.annualLimit - currentAnnualSpending;

  let status = 'ok';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 90) {
    status = 'warning';
  } else if (percentage >= 75) {
    status = 'caution';
  }

  return {
    hasLimit: true,
    percentage: Math.min(percentage, 100),
    remaining: remaining,
    status: status,
    isOverBudget: currentAnnualSpending > budget.annualLimit
  };
};
