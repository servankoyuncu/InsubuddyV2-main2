import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);

  if (error.message.includes('Invalid login credentials')) {
    return 'Ungültige E-Mail oder Passwort';
  }

  if (error.message.includes('User already registered')) {
    return 'Diese E-Mail ist bereits registriert';
  }

  if (error.message.includes('Email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse';
  }

  return error.message || 'Ein unbekannter Fehler ist aufgetreten';
};
