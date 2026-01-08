import { supabase } from '../supabase';
import { saveFinancialSnapshot } from './financialService';

// Datei zu Base64 konvertieren
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Add a new policy
export const addPolicy = async (userId, policyData, file = null) => {
  try {
    // Handle file upload if present
    let fileData = null;
    if (file) {
      const base64 = await fileToBase64(file);
      fileData = {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data: base64
      };
    }

    // Insert policy into Supabase
    const { data, error } = await supabase
      .from('policies')
      .insert([
        {
          user_id: userId,
          name: policyData.name,
          company: policyData.company,
          type: policyData.type,
          premium: policyData.premium,
          expiry_date: policyData.expiryDate || null,
          coverage: policyData.coverage || [],
          status: policyData.status || 'ok',
          ...fileData
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Trigger financial snapshot update
    try {
      const allPolicies = await getUserPolicies(userId);
      await saveFinancialSnapshot(userId, allPolicies);
    } catch (snapshotError) {
      console.error('Error saving financial snapshot:', snapshotError);
      // Don't fail the whole operation if snapshot fails
    }

    return data;
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Police:', error);
    throw error;
  }
};

// Get all policies for current user
export const getUserPolicies = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform Supabase column names to match Firebase format (for compatibility)
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
      // File data
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

// Update a policy
export const updatePolicy = async (policyId, updates, userId = null) => {
  try {
    // Transform camelCase to snake_case for Supabase
    const supabaseUpdates = {
      name: updates.name,
      company: updates.company,
      type: updates.type,
      premium: updates.premium,
      expiry_date: updates.expiryDate,
      coverage: updates.coverage,
      status: updates.status
    };

    // Remove undefined values
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

    // Trigger financial snapshot update
    if (userId) {
      try {
        const allPolicies = await getUserPolicies(userId);
        await saveFinancialSnapshot(userId, allPolicies);
      } catch (snapshotError) {
        console.error('Error saving financial snapshot:', snapshotError);
        // Don't fail the whole operation if snapshot fails
      }
    }

    return data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Police:', error);
    throw error;
  }
};

// Delete a policy
export const deletePolicy = async (policyId) => {
  try {
    // Get policy first to find userId for snapshot update
    const { data: policy } = await supabase
      .from('policies')
      .select('user_id')
      .eq('id', policyId)
      .single();

    const userId = policy?.user_id;

    // Delete the policy
    const { error } = await supabase
      .from('policies')
      .delete()
      .eq('id', policyId);

    if (error) throw error;

    // Trigger financial snapshot update
    if (userId) {
      try {
        const allPolicies = await getUserPolicies(userId);
        await saveFinancialSnapshot(userId, allPolicies);
      } catch (snapshotError) {
        console.error('Error saving financial snapshot:', snapshotError);
        // Don't fail the whole operation if snapshot fails
      }
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Police:', error);
    throw error;
  }
};

// Get expiring policies
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

    // Transform to Firebase format for compatibility
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

// Calculate total premium
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
