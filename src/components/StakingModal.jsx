import React, { useState } from 'react';
import { X, Copy, CheckCircle, Loader, ExternalLink, Coins } from 'lucide-react';
import { STAKING_TIERS, STAKING_WALLET, verifyStake } from '../services/stakingService';

export default function StakingModal({ onClose, darkMode = false, userId, walletAddress, onSuccess }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [step, setStep] = useState('select'); // select | send | verify | success
  const [txSignature, setTxSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(null);

  const copyAddress = () => {
    navigator.clipboard.writeText(STAKING_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!txSignature.trim()) {
      setError('Bitte Transaktions-ID eingeben.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await verifyStake({ txSignature: txSignature.trim(), userId, walletAddress });
    setLoading(false);
    if (res.success) {
      setResult(res);
      setStep('success');
      onSuccess?.();
    } else {
      setError(res.error || 'Verifikation fehlgeschlagen.');
    }
  };

  const tierColors = {
    blue: 'border-blue-400 bg-blue-50 text-blue-700',
    purple: 'border-purple-400 bg-purple-50 text-purple-700',
    amber: 'border-amber-400 bg-amber-50 text-amber-700',
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const subtext = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500' : 'border-gray-300 focus:ring-purple-400'
  }`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${bg}`}>

        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">$INSU Staking</h2>
              <p className="text-white/70 text-sm">Token senden → Premium erhalten</p>
            </div>
          </div>
        </div>

        <div className="p-5">

          {/* Step: Select Tier */}
          {step === 'select' && (
            <div className="space-y-3">
              <p className={`text-sm ${subtext} mb-4`}>
                Wähle einen Tier und sende die entsprechende Menge $INSU an die Staking-Adresse.
              </p>
              {STAKING_TIERS.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative ${
                    selectedTier?.id === tier.id
                      ? `border-purple-500 bg-purple-50`
                      : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2 right-4 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Beliebt
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-semibold ${text}`}>{tier.label}</div>
                      <div className={`text-sm ${subtext}`}>{tier.description}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${text}`}>{(tier.amount / 1_000_000).toFixed(0)}M</div>
                      <div className={`text-xs ${subtext}`}>$INSU</div>
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => selectedTier && setStep('send')}
                disabled={!selectedTier}
                className="w-full py-3 mt-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold rounded-2xl transition-all"
              >
                Weiter
              </button>
            </div>
          )}

          {/* Step: Send */}
          {step === 'send' && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${subtext} mb-1`}>Sende genau</p>
                <p className={`text-2xl font-bold ${text}`}>
                  {selectedTier.amount.toLocaleString()} $INSU
                </p>
                <p className={`text-xs ${subtext} mt-1`}>= {selectedTier.months} Monat{selectedTier.months > 1 ? 'e' : ''} Premium</p>
              </div>

              <div>
                <p className={`text-xs font-medium ${subtext} mb-1`}>An diese Staking-Adresse</p>
                <div className={`flex items-center gap-2 p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <code className={`text-xs flex-1 break-all ${text}`}>{STAKING_WALLET}</code>
                  <button onClick={copyAddress} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className={`text-xs ${subtext} space-y-1 p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <p className="font-medium text-blue-600">So gehts:</p>
                <p>1. Öffne Phantom Wallet</p>
                <p>2. Sende <strong>{selectedTier.amount.toLocaleString()} $INSU</strong> an die Adresse oben</p>
                <p>3. Kopiere die Transaktions-ID (TX Signature)</p>
                <p>4. Klicke auf "Transaktion eingeben"</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('select')} className={`flex-1 py-3 rounded-2xl font-medium text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  Zurück
                </button>
                <button onClick={() => setStep('verify')} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl transition-all">
                  Transaktion eingeben
                </button>
              </div>
            </div>
          )}

          {/* Step: Verify */}
          {step === 'verify' && (
            <div className="space-y-4">
              <p className={`text-sm ${subtext}`}>
                Füge die Transaktions-ID (TX Signature) aus Phantom ein. Diese findest du in der Transaktionshistorie.
              </p>

              <div>
                <label className={`block text-xs font-medium ${subtext} mb-1`}>Transaktions-ID (TX Signature)</label>
                <textarea
                  value={txSignature}
                  onChange={e => setTxSignature(e.target.value)}
                  rows={3}
                  className={inputCls + ' resize-none font-mono text-xs'}
                  placeholder="5xKy3...abc123"
                />
              </div>

              <a
                href={`https://solscan.io/account/${STAKING_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-500 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Staking-Wallet auf Solscan ansehen
              </a>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep('send')} className={`flex-1 py-3 rounded-2xl font-medium text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  Zurück
                </button>
                <button onClick={handleVerify} disabled={loading} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2">
                  {loading ? <><Loader className="w-4 h-4 animate-spin" /> Prüfen...</> : 'Verifizieren'}
                </button>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${text}`}>Premium aktiv!</h3>
                <p className={`text-sm ${subtext} mt-1`}>
                  {result?.months} Monat{result?.months > 1 ? 'e' : ''} Premium freigeschaltet
                </p>
                {result?.expires_at && (
                  <p className={`text-xs ${subtext} mt-1`}>
                    Läuft ab: {new Date(result.expires_at).toLocaleDateString('de-CH')}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-all">
                Fertig
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
