import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

export function useAdmin() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Query admins table for current user
        const { data, error } = await supabase
          .from('admins')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setIsAdmin(data && data.role === 'admin');
      } catch (error) {
        console.error('Fehler beim Prüfen der Admin-Rechte:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [currentUser]);

  return { isAdmin, loading };
}
