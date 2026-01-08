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
    // 1. Initialer Check der Session beim Laden der Seite
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user ?? null);
      } catch (error) {
        console.error("Auth Initialisierungsfehler:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Auf Auth-Änderungen reagieren (Login, Logout, Token-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔵 Auth Event:", _event);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- ACTIONS ---

  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    // WICHTIG: Erst lokalen State nullen, um "undefined" Requests beim Unmounten zu verhindern
    setCurrentUser(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
    return data;
  };

  const value = {
    currentUser,
    loading,
    signup,
    signUp: signup,
    login,
    signIn: login,
    logout,
    signOut: logout,
    loginWithGoogle,
    signInWithGoogle: loginWithGoogle,
    resetPassword,
    updatePassword: async (password) => {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return data;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Das ist die wichtigste Zeile: Wir rendern die App erst, 
          wenn loading false ist. Das verhindert "undefined" IDs in den Services.
      */}
      {!loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">InsuBuddy wird geladen...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};