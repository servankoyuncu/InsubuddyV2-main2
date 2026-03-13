import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { mintPolicyCertificate, TOTAL_MINT_FEE_SOL } from '../services/nftService';

const STEPS = {
  confirm: 'confirm',
  minting: 'minting',
  success: 'success',
};

export default function MintPolicyModal({ policy, userId, onClose, onSuccess, darkMode = false }) {
  const wallet = useWallet();
  const [step, setStep] = useState(STEPS.confirm);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500';

  const handleMint = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setError('Wallet nicht verbunden. Bitte verbinde zuerst deine Phantom Wallet.');
      return;
    }
    setError('');
    setStep(STEPS.minting);
    try {
      const res = await mintPolicyCertificate({ wallet, policy, userId });
      setResult(res);
      setStep(STEPS.success);
      onSuccess?.(res);
    } catch (err) {
      setError(err.message || 'Fehler beim Zertifizieren. Bitte versuche es erneut.');
      setStep(STEPS.confirm);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${bg} rounded-3xl shadow-2xl w-full max-w-sm`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className={`font-semibold ${text}`}>Police zertifizieren</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">

          {/* STEP: Confirm */}
          {step === STEPS.confirm && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-sm font-semibold ${text}`}>{policy.type}</p>
                <p className={`text-xs mt-0.5 ${sub}`}>{policy.company || 'Anbieter unbekannt'}</p>
              </div>

              <p className={`text-sm ${sub}`}>
                Diese Police wird auf <strong>IPFS</strong> gespeichert und kryptografisch verifiziert. Du erhältst ein dauerhaftes, unveränderliches Zertifikat.
              </p>

              {/* Cost breakdown */}
              <div className={`rounded-2xl border p-4 space-y-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>Kosten</p>
                <div className="flex justify-between text-sm">
                  <span className={sub}>InsuBuddy Gebühr</span>
                  <span className={text}>0.02 SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={sub}>Netzwerkgebühr (ca.)</span>
                  <span className={text}>~0.01 SOL</span>
                </div>
                <div className={`flex justify-between text-sm font-semibold pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={text}>Total</span>
                  <span className="text-indigo-500">~{TOTAL_MINT_FEE_SOL} SOL</span>
                </div>
              </div>

              {!wallet.connected && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${darkMode ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/30' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Keine Wallet verbunden. Melde dich via Phantom an.
                </div>
              )}

              {error && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${darkMode ? 'bg-red-900/30 text-red-300 border border-red-700/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleMint}
                disabled={!wallet.connected}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Jetzt zertifizieren
              </button>
            </div>
          )}

          {/* STEP: Minting */}
          {step === STEPS.minting && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div>
                <p className={`font-semibold ${text}`}>Wird zertifiziert...</p>
                <p className={`text-sm mt-1 ${sub}`}>Bitte bestätige die Transaktion in Phantom</p>
              </div>
              <div className={`space-y-2 text-left text-xs ${sub}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Metadaten werden auf IPFS hochgeladen...
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Warte auf Phantom-Bestätigung...
                </div>
              </div>
            </div>
          )}

          {/* STEP: Success */}
          {step === STEPS.success && result && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className={`font-semibold text-lg ${text}`}>Zertifiziert! ✓</p>
                <p className={`text-sm mt-1 ${sub}`}>
                  Deine Police ist jetzt dauerhaft auf IPFS gespeichert.
                </p>
              </div>
              <a
                href={result.ipfsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-indigo-300 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Zertifikat auf IPFS ansehen
              </a>
              <a
                href={`https://solscan.io/tx/${result.txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-2.5 text-sm ${sub} hover:underline`}
              >
                Transaktion auf Solscan ansehen ↗
              </a>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
              >
                Fertig
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
