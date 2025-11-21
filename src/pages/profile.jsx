import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Mein Profil</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail-Adresse
            </label>
            <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded">
              {currentUser?.email}
            </p>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Ausloggen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;