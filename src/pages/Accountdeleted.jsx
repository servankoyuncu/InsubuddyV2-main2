import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield } from 'lucide-react';

function AccountDeleted() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">InsuBuddy</h1>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Konto erfolgreich gelöscht
          </h2>
          
          <p className="text-gray-600 mb-6">
            Ihr InsuBuddy-Konto und alle zugehörigen Daten wurden permanent gelöscht.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>Was wurde gelöscht:</strong>
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside mt-2 space-y-1">
              <li>Alle Versicherungspolicen</li>
              <li>Alle Wertgegenstände</li>
              <li>Ihre persönlichen Einstellungen</li>
              <li>Ihr Login und Konto-Daten</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Vielen Dank, dass Sie InsuBuddy genutzt haben. 
            Falls Sie sich entscheiden zurückzukehren, können Sie jederzeit ein neues Konto erstellen.
          </p>

          <button
            onClick={() => navigate('/register')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-3"
          >
            Neues Konto erstellen
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Zur Startseite
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Fragen? Kontaktieren Sie uns unter{' '}
          <a href="mailto:support@insubuddy.com" className="text-blue-600 hover:text-blue-700">
            support@insubuddy.com
          </a>
        </div>
      </div>
    </div>
  );
}

export default AccountDeleted;