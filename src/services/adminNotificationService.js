import { supabase } from '../supabase';

// Admin Notification erstellen
export const createAdminNotification = async (notificationData) => {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert([{
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'normal',
        active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating admin notification:', error);
    throw error;
  }
};

// Admin Notification aktualisieren
export const updateAdminNotification = async (notificationId, updates) => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating admin notification:', error);
    throw error;
  }
};

// Admin Notification löschen
export const deleteAdminNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    throw error;
  }
};

// Alle Admin Notifications abrufen (für Admin Dashboard) mit Real-time Updates
export const getAllAdminNotifications = (callback) => {
  // Initial fetch
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin notifications:', error);
      callback([]);
      return;
    }

    const notifications = (data || []).map(doc => ({
      id: doc.id,
      title: doc.title,
      message: doc.message,
      type: doc.type,
      priority: doc.priority,
      active: doc.active,
      createdAt: doc.created_at ? new Date(doc.created_at) : null,
      updatedAt: doc.updated_at ? new Date(doc.updated_at) : null
    }));

    callback(notifications);
  };

  fetchNotifications();

  // Subscribe to real-time changes
  const subscription = supabase
    .channel('admin_notifications_all')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'admin_notifications' },
      () => {
        fetchNotifications();
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

// Aktive Admin Notifications abrufen (für User Dashboard)
export const getActiveAdminNotifications = async () => {
  try {
    console.log('🔍 getActiveAdminNotifications aufgerufen');

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('📄 Supabase data received, rows:', data?.length || 0);

    const notifications = (data || []).map(doc => ({
      id: doc.id,
      title: doc.title,
      message: doc.message,
      type: doc.type,
      priority: doc.priority,
      active: doc.active,
      createdAt: doc.created_at ? new Date(doc.created_at) : null
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
    const { error } = await supabase
      .from('admin_notifications')
      .update({
        active: !currentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error toggling notification status:', error);
    throw error;
  }
};
