import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Shield, Trash2, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

function AccountSettings() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Bitte tippe "DELETE" um zu bestätigen');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Delete all user data from Supabase
      const userId = currentUser.id;

      // Delete policies
      await supabase
        .from('policies')
        .delete()
        .eq('user_id', userId);

      // Delete valuable items
      await supabase
        .from('valuable_items')
        .delete()
        .eq('user_id', userId);

      // Delete user settings
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', userId);

      // Delete user profile
      await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      // 2. Delete auth user (this also triggers cascade delete in DB)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        // If admin delete fails, try regular signOut
        console.error('Admin delete failed:', deleteError);
        await signOut();
      }

      // 3. Redirect to goodbye page
      navigate('/account-deleted');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Fehler beim Löschen des Kontos. Bitte kontaktieren Sie den Support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-4 pt-12 pb-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white rounded-full shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Konto-Einstellungen</h1>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Konto-Informationen</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">E-Mail</label>
              <div className="text-gray-900 font-medium">{currentUser?.email}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Konto erstellt</label>
              <div className="text-gray-900">
                {new Date(currentUser?.created_at).toLocaleDateString('de-CH', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-200">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-red-600 mb-2">Gefahrenzone</h2>
              <p className="text-sm text-gray-600 mb-4">
                Sobald Sie Ihr Konto löschen, gibt es kein Zurück mehr. Bitte seien Sie sicher.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Konto löschen
            </button>
          ) : (
            <div className="space-y-4">
              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ⚠️ Diese Aktion kann nicht rückgängig gemacht werden!
                </p>
                <p className="text-sm text-red-700">
                  Folgende Daten werden permanent gelöscht:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
                  <li>Alle Ihre Versicherungspolicen</li>
                  <li>Alle Ihre Wertgegenstände</li>
                  <li>Ihre Einstellungen und Präferenzen</li>
                  <li>Ihr Konto und Login-Daten</li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tippe <span className="font-bold text-red-600">"DELETE"</span> um zu bestätigen
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="DELETE"
                  disabled={loading}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmText !== 'DELETE'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Lösche Konto...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Konto endgültig löschen
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                    setError('');
                  }}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Falls Sie Probleme haben oder Fragen zu Ihrem Konto haben, 
            kontaktieren Sie uns bitte unter support@insubuddy.com bevor Sie Ihr Konto löschen.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;