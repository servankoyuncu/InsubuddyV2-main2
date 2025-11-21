import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Benachrichtigungs-Einstellungen speichern
export const saveNotificationSettings = async (userId, settings) => {
  try {
    await setDoc(doc(db, 'userSettings', userId), {
      notifications: settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Einstellungen:', error);
    throw error;
  }
};

// Benachrichtigungs-Einstellungen laden
export const getNotificationSettings = async (userId) => {
  try {
    const docRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().notifications || {
        enabled: true,
        reminderDays: 30
      };
    }
    
    // Standard-Einstellungen
    return {
      enabled: true,
      reminderDays: 30
    };
  } catch (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    return {
      enabled: true,
      reminderDays: 30
    };
  }
};

// Prüfe ablaufende Policen und erstelle Benachrichtigungen
export const checkExpiringPolicies = (policies, reminderDays) => {
  const notifications = [];
  const today = new Date();
  
  policies.forEach(policy => {
    if (!policy.expiryDate) return;
    
    const expiryDate = new Date(policy.expiryDate);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Benachrichtigung erstellen wenn innerhalb des Erinnerungs-Zeitraums
    if (diffDays > 0 && diffDays <= reminderDays) {
      notifications.push({
        id: `expiry-${policy.id}`,
        type: 'warning',
        title: `${policy.type} läuft bald ab`,
        message: `Ihre ${policy.type} bei ${policy.company} läuft in ${diffDays} Tagen ab`,
        policyId: policy.id,
        daysLeft: diffDays,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
    
    // Kritische Warnung wenn bereits abgelaufen
    if (diffDays < 0) {
      notifications.push({
        id: `expired-${policy.id}`,
        type: 'critical',
        title: `${policy.type} ist abgelaufen!`,
        message: `Ihre ${policy.type} bei ${policy.company} ist seit ${Math.abs(diffDays)} Tagen abgelaufen`,
        policyId: policy.id,
        daysLeft: diffDays,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  });
  
  return notifications;
};