import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStoreKit } from '../hooks/useStoreKit';
import { supabase } from '../supabase';
import bs58 from 'bs58';

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function WalletLoginButton({ onSuccess, darkMode = false }) {
  const { publicKey, connected, connecting, connect, disconnect, select, wallets, signMessage } = useWallet();
  const { loginWithWallet } = useAuth();
  const { isNative } = useStoreKit();

  const [step, setStep] = useState('idle'); // idle | select | signing | loading | error
  const [error, setError] = useState('');
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  // Once connected, automatically trigger signing
  useEffect(() => {
    if (connected && publicKey && step === 'select') {
      handleSign();
    }
  }, [connected, publicKey]);

  // iOS: wallet login not available in native app
  if (isNative) {
    return (
      <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
      }`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>Wallet-Login ist nur in der Web-Version verfügbar: <strong>insubu.netlify.app</strong></span>
      </div>
    );
  }

  const handleConnect = (walletAdapter) => {
    setError('');
    setShowWalletPicker(false);
    setStep('select');
    select(walletAdapter.adapter.name);
    connect().catch((err) => {
      setError('Verbindung fehlgeschlagen. Bitte versuche es erneut.');
      setStep('idle');
    });
  };

  const handleSign = async () => {
    try {
      setStep('signing');
      setError('');

      const message = `InsuBuddy Login: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      const signatureBytes = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signatureBytes);
      const walletAddress = publicKey.toBase58();

      setStep('loading');

      // Call the edge function
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/wallet-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          walletAddress,
          message,
          signature: signatureBase58,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Authentifizierung fehlgeschlagen');
      }

      const { access_token, refresh_token } = await response.json();

      await loginWithWallet(access_token, refresh_token);
      onSuccess?.();
    } catch (err) {
      console.error('Wallet login error:', err);
      if (err.name === 'WalletSignMessageError' || err.message?.includes('User rejected')) {
        setError('Signierung abgebrochen.');
      } else {
        setError(err.message || 'Ein Fehler ist aufgetreten.');
      }
      setStep('idle');
      disconnect();
    }
  };

  const isLoading = step === 'select' || step === 'signing' || step === 'loading' || connecting;

  const loadingText = {
    select: 'Verbinden...',
    signing: 'Bitte signieren...',
    loading: 'Einloggen...',
  }[step] || 'Verbinden...';

  return (
    <div className="w-full">
      {/* Main button */}
      <button
        onClick={() => setShowWalletPicker(true)}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium border-2 transition-all disabled:opacity-60 ${
          darkMode
            ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
            : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Mit Wallet anmelden
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <p className={`text-xs text-center mt-2 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
          {error}
        </p>
      )}

      {/* $INSU info hint */}
      <p className={`text-xs text-center mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Halte 1'000'000 $INSU → Premium automatisch aktiv
      </p>

      {/* Wallet picker modal */}
      {showWalletPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl pb-4 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <h3 className={`text-center font-semibold text-lg mt-4 mb-4 px-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Wallet auswählen
            </h3>

            <div className="px-6 space-y-3">
              {wallets.length === 0 && (
                <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Keine Wallets gefunden. Installiere Phantom für deinen Browser.
                </p>
              )}

              {wallets.map((walletAdapter) => (
                <button
                  key={walletAdapter.adapter.name}
                  onClick={() => handleConnect(walletAdapter)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    darkMode
                      ? 'border-gray-700 hover:border-purple-500 hover:bg-purple-500/10'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {walletAdapter.adapter.icon && (
                    <img
                      src={walletAdapter.adapter.icon}
                      alt={walletAdapter.adapter.name}
                      className="w-8 h-8 rounded-lg"
                    />
                  )}
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {walletAdapter.adapter.name}
                  </span>
                  {walletAdapter.readyState === 'NotDetected' && (
                    <span className={`ml-auto text-xs flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <ExternalLink className="w-3 h-3" />
                      Installieren
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="px-6 mt-4">
              <button
                onClick={() => setShowWalletPicker(false)}
                className={`w-full py-3 rounded-xl font-medium ${
                  darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
