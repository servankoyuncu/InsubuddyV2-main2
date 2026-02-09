/**
 * Advisor Service
 * Verwaltet Versicherungsberater für Admin und User-Dashboard
 */

import { supabase } from '../supabase';

/**
 * Alle Berater laden (für Admin - inkl. inaktive)
 */
export const getAllAdvisors = (callback) => {
  const fetchAdvisors = async () => {
    try {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      callback(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Berater:', error);
      callback([]);
    }
  };

  // Initial fetch
  fetchAdvisors();

  // Real-time subscription
  const subscription = supabase
    .channel('advisors_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'advisors' },
      () => {
        fetchAdvisors();
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Aktive Berater für User-Dashboard laden
 */
export const getActiveAdvisors = async () => {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Laden der aktiven Berater:', error);
    return [];
  }
};

/**
 * Featured Berater laden (für prominente Anzeige)
 */
export const getFeaturedAdvisor = async () => {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('active', true)
      .eq('featured', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Fehler beim Laden des Featured Beraters:', error);
    return null;
  }
};

/**
 * Verfügbare Beratungsthemen
 */
export const ADVISOR_TOPICS = [
  { id: 'sachversicherung', label: 'Sachversicherung', icon: 'Home', color: 'blue' },
  { id: 'auto', label: 'Autoversicherung', icon: 'Car', color: 'green' },
  { id: 'kmu', label: 'KMU / Gewerbe', icon: 'Building', color: 'purple' },
  { id: 'leben', label: 'Lebensversicherung', icon: 'Heart', color: 'red' },
  { id: 'krankenkasse', label: 'Krankenkasse', icon: 'Stethoscope', color: 'teal' },
  { id: 'vorsorge', label: 'Vorsorge / 3a', icon: 'PiggyBank', color: 'amber' }
];

/**
 * Schweizer Kantone
 */
export const SWISS_CANTONS = [
  { code: 'ZH', name: 'Zürich' },
  { code: 'BE', name: 'Bern' },
  { code: 'LU', name: 'Luzern' },
  { code: 'UR', name: 'Uri' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'GL', name: 'Glarus' },
  { code: 'ZG', name: 'Zug' },
  { code: 'FR', name: 'Freiburg' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'AG', name: 'Aargau' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Tessin' },
  { code: 'VD', name: 'Waadt' },
  { code: 'VS', name: 'Wallis' },
  { code: 'NE', name: 'Neuenburg' },
  { code: 'GE', name: 'Genf' },
  { code: 'JU', name: 'Jura' }
];

/**
 * Neuen Berater erstellen
 */
export const createAdvisor = async (advisorData) => {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .insert([{
        name: advisorData.name,
        title: advisorData.title || null,
        company: advisorData.company || null,
        photo: advisorData.photo || null,
        bio: advisorData.bio || null,
        topics: advisorData.topics || [],
        specializations: advisorData.specializations || [],
        city: advisorData.city || null,
        canton: advisorData.canton || null,
        radius_km: advisorData.radius_km || 50,
        email: advisorData.email || null,
        phone: advisorData.phone || null,
        whatsapp: advisorData.whatsapp || null,
        languages: advisorData.languages || ['Deutsch'],
        active: advisorData.active ?? true,
        featured: advisorData.featured ?? false,
        verified: advisorData.verified ?? false,
        display_order: advisorData.display_order || 0
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fehler beim Erstellen des Beraters:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Berater aktualisieren
 */
export const updateAdvisor = async (advisorId, updates) => {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .update(updates)
      .eq('id', advisorId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Beraters:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Berater-Status umschalten (aktiv/inaktiv)
 */
export const toggleAdvisorStatus = async (advisorId, currentStatus) => {
  return await updateAdvisor(advisorId, { active: !currentStatus });
};

/**
 * Featured-Status umschalten
 */
export const toggleAdvisorFeatured = async (advisorId, currentFeatured) => {
  return await updateAdvisor(advisorId, { featured: !currentFeatured });
};

/**
 * Berater löschen
 */
export const deleteAdvisor = async (advisorId) => {
  try {
    const { error } = await supabase
      .from('advisors')
      .delete()
      .eq('id', advisorId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Löschen des Beraters:', error);
    return { success: false, error: error.message };
  }
};

/**
 * WhatsApp-Link generieren
 */
export const generateWhatsAppLink = (phone, message = '') => {
  // Nummer formatieren (nur Zahlen)
  const cleanPhone = phone.replace(/[^0-9+]/g, '').replace('+', '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
};

/**
 * Telefon-Link generieren
 */
export const generatePhoneLink = (phone) => {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `tel:${cleanPhone}`;
};

/**
 * Email-Link generieren
 */
export const generateEmailLink = (email, subject = '', body = '') => {
  let link = `mailto:${email}`;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length > 0) link += `?${params.join('&')}`;
  return link;
};

// =====================================================
// REVIEW FUNCTIONS
// =====================================================

/**
 * Reviews für einen Berater laden
 */
export const getAdvisorReviews = async (advisorId) => {
  try {
    const { data, error } = await supabase
      .from('advisor_reviews')
      .select('*')
      .eq('advisor_id', advisorId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Laden der Reviews:', error);
    return [];
  }
};

/**
 * Prüfen ob User bereits bewertet hat
 */
export const hasUserReviewed = async (advisorId, userId) => {
  try {
    const { data, error } = await supabase
      .from('advisor_reviews')
      .select('id')
      .eq('advisor_id', advisorId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Fehler beim Prüfen der Review:', error);
    return false;
  }
};

/**
 * Review erstellen
 */
export const createReview = async (reviewData) => {
  try {
    const { data, error } = await supabase
      .from('advisor_reviews')
      .insert([{
        advisor_id: reviewData.advisorId,
        user_id: reviewData.userId,
        rating: reviewData.rating,
        title: reviewData.title || null,
        comment: reviewData.comment || null,
        topics_consulted: reviewData.topicsConsulted || [],
        would_recommend: reviewData.wouldRecommend ?? true
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fehler beim Erstellen der Review:', error);
    // Prüfen ob es ein Unique-Constraint Fehler ist
    if (error.code === '23505') {
      return { success: false, error: 'Sie haben diesen Berater bereits bewertet.' };
    }
    return { success: false, error: error.message };
  }
};

/**
 * Review aktualisieren
 */
export const updateReview = async (reviewId, userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('advisor_reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('user_id', userId) // Sicherheit: nur eigene Reviews
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Review:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Review löschen
 */
export const deleteReview = async (reviewId, userId) => {
  try {
    const { error } = await supabase
      .from('advisor_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId); // Sicherheit: nur eigene Reviews

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Löschen der Review:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// POLICY SHARING FUNCTIONS
// =====================================================

/**
 * Policen an Berater senden
 */
export const sharePoliciesWithAdvisor = async (userId, advisorId, policyIds, message = '') => {
  try {
    const { data, error } = await supabase
      .from('shared_policies')
      .insert([{
        user_id: userId,
        advisor_id: advisorId,
        policy_ids: policyIds,
        message: message || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fehler beim Teilen der Policen:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Geteilte Policen für Berater laden (Admin/Berater-Sicht)
 */
export const getSharedPoliciesForAdvisor = async (advisorId) => {
  try {
    const { data, error } = await supabase
      .from('shared_policies')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Laden geteilter Policen:', error);
    return [];
  }
};

/**
 * Prüfen ob User bereits Policen an diesen Berater geteilt hat
 */
export const hasUserSharedWithAdvisor = async (userId, advisorId) => {
  try {
    const { data, error } = await supabase
      .from('shared_policies')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Fehler beim Prüfen geteilter Policen:', error);
    return null;
  }
};

/**
 * Formatiert das Rating als Sterne-Text
 */
export const formatRating = (rating) => {
  if (!rating || rating === 0) return 'Noch keine Bewertungen';
  return `${rating.toFixed(1)} / 5`;
};

/**
 * Holt das Topic-Label anhand der ID
 */
export const getTopicLabel = (topicId) => {
  const topic = ADVISOR_TOPICS.find(t => t.id === topicId);
  return topic ? topic.label : topicId;
};
