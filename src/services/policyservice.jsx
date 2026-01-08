import { supabase } from '../supabase';
import { saveFinancialSnapshot } from './financialService';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// --- ADD POLICY ---
export const addPolicy = async (userId, policyData, file = null) => {
  try {
    let filePath = null;
    let fileUrl = null;

    // 1. Datei in Storage hochladen (statt Base64)
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('policy-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // URL der Datei abrufen
      const { data: urlData } = supabase.storage
        .from('policy-documents')
        .getPublicUrl(fileName);
      
      fileUrl = urlData.publicUrl;
    }

    // 2. Police in Datenbank speichern (mit Link statt Daten)
    const insertData = {
      user_id: userId,
      name: policyData.name,
      company: policyData.company,
      type: policyData.type,
      premium: policyData.premium,
      expiry_date: policyData.expiryDate || null,
      coverage: policyData.coverage || [],
      status: 'ok',
      file_name: file ? file.name : null,
      file_data: fileUrl // Hier speichern wir jetzt die URL!
    };

    const { data, error } = await supabase
      .from('policies')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Police:', error);
    throw error;
  }
};

// --- GET POLICIES ---
export const getUserPolicies = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(policy => ({
      id: policy.id,
      name: policy.name,
      company: policy.company,
      type: policy.type,
      premium: policy.premium,
      expiryDate: policy.expiry_date,
      coverage: policy.coverage || [],
      status: policy.status,
      userId: policy.user_id,
      createdAt: policy.created_at,
      updatedAt: policy.updated_at,
      file: policy.file_data ? {
        name: policy.file_name,
        type: policy.file_type,
        size: policy.file_size,
        data: policy.file_data
      } : null
    }));
  } catch (error) {
    console.error('Fehler beim Abrufen der Policen:', error);
    return [];
  }
};

// --- UPDATE POLICY ---
export const updatePolicy = async (policyId, updates, userId = null) => {
  try {
    const supabaseUpdates = {
      name: updates.name,
      company: updates.company,
      type: updates.type,
      premium: updates.premium,
      expiry_date: updates.expiryDate,
      coverage: updates.coverage,
      status: updates.status
    };

    Object.keys(supabaseUpdates).forEach(key =>
      supabaseUpdates[key] === undefined && delete supabaseUpdates[key]
    );

    const { data, error } = await supabase
      .from('policies')
      .update(supabaseUpdates)
      .eq('id', policyId)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      const allPolicies = await getUserPolicies(userId);
      await saveFinancialSnapshot(userId, allPolicies);
    }

    return data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Police:', error);
    throw error;
  }
};

// --- DELETE POLICY (Hier hat die Funktion gefehlt!) ---
export const deletePolicy = async (policyId) => {
  try {
    const { data: policy } = await supabase
      .from('policies')
      .select('user_id')
      .eq('id', policyId)
      .single();

    const userId = policy?.user_id;

    const { error } = await supabase
      .from('policies')
      .delete()
      .eq('id', policyId);

    if (error) throw error;

    if (userId) {
      const allPolicies = await getUserPolicies(userId);
      await saveFinancialSnapshot(userId, allPolicies);
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Police:', error);
    throw error;
  }
};

// --- EXPIRING POLICIES ---
export const getExpiringPolicies = async (userId, daysThreshold = 30) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('user_id', userId)
      .gte('expiry_date', today.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(policy => ({
      id: policy.id,
      name: policy.name,
      company: policy.company,
      type: policy.type,
      premium: policy.premium,
      expiryDate: policy.expiry_date,
      coverage: policy.coverage || [],
      status: policy.status,
      userId: policy.user_id
    }));
  } catch (error) {
    console.error('Error getting expiring policies:', error);
    return [];
  }
};

// --- CALCULATE PREMIUM ---
export const calculateTotalPremium = (policies) => {
  return policies.reduce((total, policy) => {
    if (policy.premium) {
      const premiumValue = parseFloat(policy.premium.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(premiumValue)) {
        return total + premiumValue;
      }
    }
    return total;
  }, 0);
};