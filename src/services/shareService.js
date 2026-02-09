import { supabase } from '../supabase';

// Menschenlesbare Zeichen (ohne 0/O/l/I/1 um Verwechslungen zu vermeiden)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export const generateShareCode = () => {
  let code = '';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (let i = 0; i < 8; i++) {
    code += CHARS[array[i] % CHARS.length];
  }
  return code;
};

export const getShareUrl = (shareCode) => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${baseUrl}/share/${shareCode}`;
};

export const createPolicyShare = async (userId, selectedPolicies, advisorName = '', message = '') => {
  const policyData = selectedPolicies.map(p => ({
    id: p.id,
    name: p.name,
    company: p.company,
    type: p.type,
    premium: p.premium,
    expiryDate: p.expiryDate,
    coverage: p.coverage || [],
    status: p.status,
    file: p.file ? {
      name: p.file.name,
      data: p.file.data
    } : null
  }));

  // Retry bei Code-Kollision (max 3 Versuche)
  for (let attempt = 0; attempt < 3; attempt++) {
    const shareCode = generateShareCode();

    const { data, error } = await supabase
      .from('policy_shares')
      .insert([{
        share_code: shareCode,
        user_id: userId,
        policy_ids: selectedPolicies.map(p => p.id),
        policy_data: policyData,
        advisor_name: advisorName || null,
        message: message || null
      }])
      .select()
      .single();

    if (!error) return { shareCode, data };
    if (error.code !== '23505') throw error; // 23505 = unique violation
  }

  throw new Error('Konnte keinen eindeutigen Share-Code generieren');
};

export const getShareByCode = async (code) => {
  const { data, error } = await supabase
    .from('policy_shares')
    .select('*')
    .eq('share_code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (data && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // View-Count erhöhen (fire-and-forget)
  supabase
    .from('policy_shares')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)
    .then(() => {});

  return data;
};
