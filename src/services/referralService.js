import { supabase } from '../supabase';

// Gleiche Zeichenmenge wie bei Share-Codes (keine verwechselbaren Zeichen)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

const generateCode = () => {
  let code = '';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (let i = 0; i < 8; i++) {
    code += CHARS[array[i] % CHARS.length];
  }
  return code;
};

export const getReferralLink = (code) => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${baseUrl}/register?ref=${code}`;
};

// Holt bestehenden Code oder erstellt neuen
export const getOrCreateReferralCode = async (userId) => {
  try {
    // Prüfe ob User bereits einen Code hat
    const { data: existing, error: fetchError } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', userId)
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) return existing.referral_code;

    // Neuen Code erstellen (mit Retry bei Kollision)
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateCode();
      const { error } = await supabase
        .from('referrals')
        .insert([{
          referrer_id: userId,
          referral_code: code,
          status: 'pending'
        }]);

      if (!error) return code;
      if (error.code !== '23505') throw error; // 23505 = unique violation
    }

    throw new Error('Konnte keinen eindeutigen Empfehlungscode generieren');
  } catch (error) {
    console.error('Fehler beim Erstellen des Empfehlungscodes:', error);
    throw error;
  }
};

// Statistiken für einen User
export const getUserReferralStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', userId);

    if (error) throw error;

    const referrals = data || [];
    return {
      total: referrals.length,
      signedUp: referrals.filter(r => r.status === 'signed_up').length
    };
  } catch (error) {
    console.error('Fehler beim Laden der Empfehlungsstatistik:', error);
    return { total: 0, signedUp: 0 };
  }
};

// Prüft ob ein Referral-Code existiert (für Register-Seite)
export const validateReferralCode = async (code) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id, referrer_id')
      .eq('referral_code', code)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Fehler beim Validieren des Codes:', error);
    return null;
  }
};

// Trackt eine erfolgreiche Registrierung über Referral
export const trackReferralSignup = async (code, newUserId, newUserEmail) => {
  try {
    const { error } = await supabase
      .from('referrals')
      .update({
        referred_user_id: newUserId,
        referred_email: newUserEmail,
        status: 'signed_up',
        completed_at: new Date().toISOString()
      })
      .eq('referral_code', code)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Fehler beim Tracken der Empfehlung:', error);
    // Fehler hier nicht werfen - Registrierung soll trotzdem klappen
  }
};
