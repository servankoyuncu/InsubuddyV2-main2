import { supabase } from '../supabase';

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
});

/**
 * Get or create a managed Solana wallet for the user.
 * Called automatically on first policy upload.
 */
export const ensureUserWallet = async (userId) => {
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/wallet-service`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Wallet-Service Fehler');
    }

    return await res.json();
  } catch (error) {
    console.error('ensureUserWallet error:', error);
    return null;
  }
};

/**
 * Mint a policy certificate invisibly (server-side).
 * Uploads metadata to IPFS and records on Solana.
 * Fire-and-forget: non-blocking.
 */
export const mintPolicyCertificate = async (policyId, userId, policyData) => {
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/mint-policy`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ policyId, userId, policyData }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Mint-Policy Fehler');
    }

    return await res.json();
  } catch (error) {
    console.error('mintPolicyCertificate error (non-critical):', error);
    return null;
  }
};

/**
 * Get NFT / certificate data for a policy from the DB.
 */
export const getPolicyCertificate = async (policyId) => {
  try {
    const { data } = await supabase
      .from('policy_nfts')
      .select('*')
      .eq('policy_id', policyId)
      .single();
    return data || null;
  } catch {
    return null;
  }
};

/**
 * Get all certificates for a user (for profile overview).
 */
export const getUserCertificates = async (userId) => {
  try {
    const { data } = await supabase
      .from('policy_nfts')
      .select('*')
      .eq('user_id', userId)
      .order('minted_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Get the user's managed wallet public key.
 */
export const getUserWalletAddress = async (userId) => {
  try {
    const { data } = await supabase
      .from('user_wallets')
      .select('public_key, network')
      .eq('user_id', userId)
      .single();
    return data || null;
  } catch {
    return null;
  }
};

/**
 * Build the Solana Explorer URL for a transaction.
 */
export const getExplorerUrl = (txSignature, network = 'devnet') => {
  if (!txSignature || txSignature.startsWith('insubuddy://')) return null;
  return `https://explorer.solana.com/tx/${txSignature}${network === 'devnet' ? '?cluster=devnet' : ''}`;
};

/**
 * Build the InsuBuddy verification URL for a policy.
 */
export const getVerifyUrl = (policyId) => {
  const base = import.meta.env.VITE_APP_URL || 'https://insubu.netlify.app';
  return `${base}/verify/${policyId}`;
};
