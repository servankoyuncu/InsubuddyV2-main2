import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Admin Notification erstellen
export const createAdminNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, 'adminNotifications'), {
      ...notificationData,
      active: true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating admin notification:', error);
    throw error;
  }
};

// Admin Notification aktualisieren
export const updateAdminNotification = async (notificationId, updates) => {
  try {
    await updateDoc(doc(db, 'adminNotifications', notificationId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating admin notification:', error);
    throw error;
  }
};

// Admin Notification löschen
export const deleteAdminNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'adminNotifications', notificationId));
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    throw error;
  }
};

// Alle Admin Notifications abrufen (für Admin Dashboard)
export const getAllAdminNotifications = (callback) => {
  const q = query(
    collection(db, 'adminNotifications'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
    callback(notifications);
  });
};

// Aktive Admin Notifications abrufen (für User Dashboard)
export const getActiveAdminNotifications = async () => {
  try {
    console.log('🔍 getActiveAdminNotifications aufgerufen');
    const q = query(
      collection(db, 'adminNotifications'),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    console.log('📊 Firestore Query erstellt');
    const snapshot = await getDocs(q);
    console.log('📄 Snapshot erhalten, Docs:', snapshot.docs.length);
    
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
    
    console.log('✅ Notifications verarbeitet:', notifications);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting active admin notifications:', error);
    return [];
  }
};

// Notification aktivieren/deaktivieren
export const toggleNotificationStatus = async (notificationId, currentStatus) => {
  try {
    await updateDoc(doc(db, 'adminNotifications', notificationId), {
      active: !currentStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error toggling notification status:', error);
    throw error;
  }
};