import React, { useState } from 'react';
import { X, Crown, Sparkles, TrendingUp, FileText, Download, Check, Star } from 'lucide-react';
import { getPremiumPrices, getPremiumFeatures, activatePremium } from '../services/premiumService';

const PremiumModal = ({
  onClose,
  darkMode = false,
  userId,
  onPremiumActivated,
  featureRequested = null
}) => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const prices = getPremiumPrices();
  const features = getPremiumFeatures();

  // Icon-Komponenten Mapping
  const iconMap = {
    Sparkles,
    TrendingUp,
    FileText,
    Download
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);

    try {
      // Für Demo/Testing: Aktiviere Premium direkt
      // In Produktion: Hier würde der Payment-Flow starten
      const months = selectedPlan === 'yearly' ? 12 : 1;
      const result = await activatePremium(userId, months);

      if (result.success) {
        onPremiumActivated?.();
        onClose();
      } else {
        alert('Fehler beim Aktivieren: ' + result.error);
      }
    } catch (error) {
      console.error('Fehler:', error);
      alert('Ein Fehler ist aufgetreten');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Premium Header mit Gradient */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 p-6 text-white">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">InsuBuddy Premium</h2>
              <p className="text-white/80 text-sm">Unlock alle Features</p>
            </div>
          </div>

          {featureRequested && (
            <div className="bg-white/20 rounded-lg p-3 text-sm">
              <span className="font-medium">Diese Funktion ist Premium:</span>
              <br />
              {features.find(f => f.id === featureRequested)?.name || 'Premium Feature'}
            </div>
          )}
        </div>

        {/* Features List */}
        <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="space-y-3 mb-6">
            {features.map((feature) => {
              const IconComponent = iconMap[feature.icon] || Star;
              return (
                <div key={feature.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-amber-500/20' : 'bg-amber-100'
                  }`}>
                    <IconComponent className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {feature.name}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {feature.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Options */}
          <div className="space-y-3 mb-6">
            {/* Yearly Plan */}
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                selectedPlan === 'yearly'
                  ? 'border-amber-500 bg-amber-500/10'
                  : darkMode
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {prices.yearly.savings && (
                <span className="absolute -top-2 right-4 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {prices.yearly.savings} sparen
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Jährlich
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Beste Wahl
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    CHF {prices.yearly.price}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    pro Jahr
                  </div>
                </div>
              </div>
              {selectedPlan === 'yearly' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className="w-5 h-5 text-amber-500" />
                </div>
              )}
            </button>

            {/* Monthly Plan */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                selectedPlan === 'monthly'
                  ? 'border-amber-500 bg-amber-500/10'
                  : darkMode
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Monatlich
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Flexibel kündbar
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    CHF {prices.monthly.price}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    pro Monat
                  </div>
                </div>
              </div>
              {selectedPlan === 'monthly' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className="w-5 h-5 text-amber-500" />
                </div>
              )}
            </button>
          </div>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Wird aktiviert...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Premium aktivieren
              </>
            )}
          </button>

          {/* Note */}
          <p className={`text-center text-xs mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Jederzeit kündbar. Sichere Zahlung.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
