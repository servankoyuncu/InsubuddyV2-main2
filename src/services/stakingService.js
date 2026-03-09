import { supabase } from '../supabase';

export const STAKING_WALLET = '8YorNCXpJBDpjoj9jnyvDdMBk4Acqd7A6XWm24wGCrU7';

export const STAKING_TIERS = [
  {
    id: 'basis',
    label: 'Basis',
    amount: 1_000_000,
    months: 1,
    description: '1 Monat Premium',
    color: 'blue',
  },
  {
    id: 'plus',
    label: 'Plus',
    amount: 2_000_000,
    months: 3,
    description: '3 Monate Premium',
    color: 'purple',
    popular: true,
  },
  {
    id: 'pro',
    label: 'Pro',
    amount: 3_000_000,
    months: 12,
    description: '12 Monate Premium',
    color: 'amber',
  },
];

/**
 * Verify stake transaction via Edge Function
 */
export const verifyStake = async ({ txSignature, userId, walletAddress }) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/verify-stake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ txSignature, userId, walletAddress }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Verifikation fehlgeschlagen');
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get active stakes for a user
 */
export const getActiveStakes = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('insu_stakes')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[stakingService] getActiveStakes error:', error);
    return [];
  }
};

/**
 * Check if user has an active stake (for premium check)
 */
export const hasActiveStake = async (userId) => {
  const stakes = await getActiveStakes(userId);
  return stakes.length > 0;
};
