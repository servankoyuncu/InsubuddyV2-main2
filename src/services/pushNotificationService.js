import { supabase } from '../supabase';

/**
 * Speichert oder aktualisiert den Push-Token eines Users in der DB.
 * Wird beim App-Start nach erfolgreicher Registrierung aufgerufen.
 */
export const registerPushToken = async (userId, token, platform) => {
  const { error } = await supabase
    .from('device_push_tokens')
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' }
    );

  if (error) {
    console.error('Push Token speichern fehlgeschlagen:', error);
  }
};

/**
 * Löscht den Push-Token beim Logout, damit der User keine
 * Notifications mehr erhält wenn er nicht eingeloggt ist.
 */
export const removePushToken = async (token) => {
  const { error } = await supabase
    .from('device_push_tokens')
    .delete()
    .eq('token', token);

  if (error) {
    console.error('Push Token löschen fehlgeschlagen:', error);
  }
};
