import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email/password (kompatibel mit altem "signup" Name)
  const signup = async (email, password) => {
    console.log('🔵 SUPABASE SIGNUP GESTARTET FÜR:', email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) throw error;

      console.log('✅ USER ERSTELLT:', data.user?.id);
      console.log('📧 EMAIL VERIFICATION SENT!');

      return data;
    } catch (error) {
      console.error('❌ FEHLER BEIM SIGNUP:', error.message);
      throw error;
    }
  };

  // Alias für Kompatibilität
  const signUp = signup;

  // Sign in with email/password (kompatibel mit altem "login" Name)
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  // Alias für Kompatibilität
  const signIn = login;

  // Sign in with Google OAuth
  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  };

  // Alias für Kompatibilität
  const signInWithGoogle = loginWithGoogle;

  // Sign out (kompatibel mit altem "logout" Name)
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Alias für Kompatibilität
  const signOut = logout;

  // Reset password
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });

    if (error) throw error;
    return data;
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (currentUser && !currentUser.email_confirmed_at) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email
      });
      if (error) throw error;
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  };

  const value = {
    currentUser,
    // Alte Firebase Namen (für Kompatibilität)
    signup,
    login,
    loginWithGoogle,
    logout,
    resendVerificationEmail,
    // Neue Supabase Namen
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
