import { supabase } from '../supabase';

/**
 * Sendet eine Frage an den InsuBuddy KI-Assistenten
 * @param {string} question - Die Frage des Nutzers
 * @param {Array} conversationHistory - Bisheriger Gesprächsverlauf [{role, content}]
 * @returns {Promise<{answer: string, policiesUsed: number}>}
 */
export const askPolicyChat = async (question, conversationHistory = []) => {
  const { data, error } = await supabase.functions.invoke('policy-chat', {
    body: { question, conversationHistory }
  });

  if (error) throw new Error(error.message || 'Fehler beim Abrufen der Antwort');
  if (data?.error) throw new Error(data.error);

  return data;
};
