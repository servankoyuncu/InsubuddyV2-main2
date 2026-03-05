/**
 * Premium Service
 * Verwaltet Premium-Abonnements und Feature-Zugriff
 */

import { supabase } from '../supabase';

// Premium Features
export const PREMIUM_FEATURES = {
  SMART_IMPORT: 'smart_import',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  UNLIMITED_POLICIES: 'unlimited_policies',
  PDF_EXPORT: 'pdf_export',
  AI_CHAT: 'ai_chat'
};

// Maximale Anzahl Policen für Free-Nutzer
export const FREE_TIER_LIMITS = {
  MAX_POLICIES: 3,
  MAX_VALUABLES: 5
};

/**
 * Prüft ob der aktuelle Benutzer Premium ist
 */
export const checkPremiumStatus = async (userId) => {
  try {
    if (!userId) return { isPremium: false, expiresAt: null };

    // Prüfe User Metadata
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Fehler beim Abrufen des Users:', error);
      return { isPremium: false, expiresAt: null };
    }

    const metadata = user.user_metadata || {};
    const isPremium = metadata.is_premium === true;
    const expiresAt = metadata.premium_expires_at || null;

    // Prüfen ob Premium abgelaufen ist
    if (isPremium && expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (expiryDate < new Date()) {
        // Premium abgelaufen - Status zurücksetzen
        await updatePremiumStatus(userId, false, null);
        return { isPremium: false, expiresAt: null };
      }
    }

    return { isPremium, expiresAt };
  } catch (error) {
    console.error('Fehler beim Prüfen des Premium-Status:', error);
    return { isPremium: false, expiresAt: null };
  }
};

/**
 * Aktualisiert den Premium-Status eines Benutzers
 */
export const updatePremiumStatus = async (userId, isPremium, expiresAt = null) => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        is_premium: isPremium,
        premium_expires_at: expiresAt
      }
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Premium-Status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Aktiviert Premium für einen Benutzer (für Tests/Demo)
 * In Produktion würde dies durch einen Payment-Provider ausgelöst
 */
export const activatePremium = async (userId, durationMonths = 1) => {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  return await updatePremiumStatus(userId, true, expiresAt.toISOString());
};

/**
 * Deaktiviert Premium für einen Benutzer
 */
export const deactivatePremium = async (userId) => {
  return await updatePremiumStatus(userId, false, null);
};

/**
 * Prüft ob ein bestimmtes Feature verfügbar ist
 */
export const hasFeatureAccess = async (userId, feature) => {
  const { isPremium } = await checkPremiumStatus(userId);

  // Premium-Benutzer haben Zugriff auf alle Features
  if (isPremium) return true;

  // Free-Tier Features
  const freeFeatures = [
    // Grundfunktionen sind kostenlos
  ];

  return freeFeatures.includes(feature);
};

/**
 * Gibt die Premium-Preise zurück
 */
export const getPremiumPrices = () => {
  return {
    monthly: {
      price: 4.00,
      priceFormatted: 'CHF 4.–',
      currency: 'CHF',
      period: 'Monat'
    },
    yearly: {
      price: 39.00,
      priceFormatted: 'CHF 39.–',
      monthlyEquivalent: 'CHF 3.25',
      currency: 'CHF',
      period: 'Jahr',
      savings: '2 Monate gratis'
    }
  };
};

/**
 * Premium Feature Liste für Anzeige
 */
export const getPremiumFeatures = () => {
  return [
    {
      id: PREMIUM_FEATURES.SMART_IMPORT,
      name: 'Smart Import',
      description: 'PDF-Policen automatisch einlesen und ausfüllen',
      icon: 'Sparkles'
    },
    {
      id: PREMIUM_FEATURES.ADVANCED_ANALYTICS,
      name: 'Erweiterte Analysen',
      description: 'Detaillierte Kostenanalysen und Sparvorschläge',
      icon: 'TrendingUp'
    },
    {
      id: PREMIUM_FEATURES.UNLIMITED_POLICIES,
      name: 'Unbegrenzte Policen',
      description: 'Keine Limite bei der Anzahl Versicherungen',
      icon: 'FileText'
    },
    {
      id: PREMIUM_FEATURES.PDF_EXPORT,
      name: 'PDF Export',
      description: 'Alle Policen als PDF exportieren',
      icon: 'Download'
    },
    {
      id: PREMIUM_FEATURES.AI_CHAT,
      name: 'KI-Versicherungsassistent',
      description: 'Frage den KI-Assistenten zu deinen Policen',
      icon: 'Sparkles'
    }
  ];
};
