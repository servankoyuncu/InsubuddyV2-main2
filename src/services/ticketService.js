import { supabase } from '../supabase';

// Ticket erstellen (User)
export const createTicket = async (userId, userEmail, ticketData) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{
        user_id: userId,
        user_email: userEmail,
        subject: ticketData.subject,
        message: ticketData.message,
        category: ticketData.category || 'general'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Fehler beim Erstellen des Tickets:', error);
    throw error;
  }
};

// Eigene Tickets laden (User)
export const getUserTickets = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Laden der Tickets:', error);
    return [];
  }
};

// Alle Tickets laden (Admin)
export const getAllTickets = async () => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Laden aller Tickets:', error);
    return [];
  }
};

// Ticket-Status ändern (Admin)
export const updateTicketStatus = async (ticketId, status) => {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error);
    throw error;
  }
};

// Ticket beantworten (Admin)
export const replyToTicket = async (ticketId, replyText, newStatus = 'resolved') => {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        admin_reply: replyText,
        replied_at: new Date().toISOString(),
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;
  } catch (error) {
    console.error('Fehler beim Beantworten des Tickets:', error);
    throw error;
  }
};

// Ticket löschen (Admin)
export const deleteTicket = async (ticketId) => {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw error;
  } catch (error) {
    console.error('Fehler beim Löschen des Tickets:', error);
    throw error;
  }
};
