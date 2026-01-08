import { supabase } from '../supabase';

/**
 * Get user's budget settings
 */
export const getBudget = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    // Transform to camelCase for compatibility
    return {
      userId: data.user_id,
      monthlyLimit: data.monthly_limit,
      annualLimit: data.annual_limit,
      alerts: data.alerts
    };
  } catch (error) {
    console.error('Error getting budget:', error);
    return null;
  }
};

/**
 * Save or update user's budget
 */
export const saveBudget = async (userId, budgetData) => {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        monthly_limit: budgetData.monthlyLimit || 0,
        annual_limit: budgetData.annualLimit || 0,
        alerts: budgetData.alerts !== undefined ? budgetData.alerts : true
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Return in camelCase format
    return {
      userId: data.user_id,
      monthlyLimit: data.monthly_limit,
      annualLimit: data.annual_limit,
      alerts: data.alerts
    };
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
