import React, { useState } from 'react';
import { X, FileText, Check, Shield, MessageCircle, Mail, Loader2 } from 'lucide-react';
import { generateWhatsAppLink, generateEmailLink } from '../services/advisorService';
import { createPolicyShare, getShareUrl } from '../services/shareService';

const SharePoliciesModal = ({ advisor, policies, userId, darkMode, onClose }) => {
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareError, setShareError] = useState('');

  const togglePolicy = (policyId) => {
    setSelectedPolicies(prev =>
      prev.includes(policyId)
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  };

  const selectAll = () => {
    if (selectedPolicies.length === policies.length) {
      setSelectedPolicies([]);
    } else {
      setSelectedPolicies(policies.map(p => p.id));
    }
  };

  const buildPolicySummary = () => {
    const selected = policies.filter(p => selectedPolicies.includes(p.id));
    let summary = '';

    selected.forEach((policy, idx) => {
      summary += `${idx + 1}. ${policy.type || policy.name}`;
      if (policy.company) summary += ` (${policy.company})`;
      if (policy.premium) summary += ` - ${policy.premium}`;
      if (policy.file?.data) summary += ` 📎`;
      summary += '\n';
    });

    return summary;
  };

  const getPdfCount = () => {
    const selected = policies.filter(p => selectedPolicies.includes(p.id));
    return selected.filter(p => p.file?.data).length;
  };

  const handleWhatsApp = async () => {
    if (selectedPolicies.length === 0) return;
    setCreating(true);
    setShareError('');

    try {
      const selected = policies.filter(p => selectedPolicies.includes(p.id));
      const { shareCode } = await createPolicyShare(userId, selected, advisor.name, message);
      const shareUrl = getShareUrl(shareCode);
      const pdfCount = getPdfCount();

      let text = `Hallo ${advisor.name},\n\nich möchte Ihnen meine Versicherungspolicen zur Prüfung senden.\n\n`;
      text += `*Meine Policen (${selected.length}):*\n`;
      text += buildPolicySummary();

      if (pdfCount > 0) {
        text += `\n📎 ${pdfCount} PDF-${pdfCount === 1 ? 'Dokument' : 'Dokumente'} verfügbar`;
      }

      text += `\n\n🔗 *Alle Policen ansehen & PDFs herunterladen:*\n${shareUrl}`;
      text += `\n\n_(Link gültig für 7 Tage)_`;

      if (message) {
        text += `\n\n*Nachricht:* ${message}`;
      }

      text += `\n\n_Gesendet über InsuBuddy_`;

      const phone = advisor.whatsapp || advisor.phone;
      window.location.href = generateWhatsAppLink(phone, text);
      onClose();
    } catch (err) {
      console.error('Share Fehler:', err);
      setShareError('Fehler beim Erstellen des Links. Bitte erneut versuchen.');
    } finally {
      setCreating(false);
    }
  };

  const handleEmail = async () => {
    if (selectedPolicies.length === 0) return;
    setCreating(true);
    setShareError('');

    try {
      const selected = policies.filter(p => selectedPolicies.includes(p.id));
      const { shareCode } = await createPolicyShare(userId, selected, advisor.name, message);
      const shareUrl = getShareUrl(shareCode);
      const pdfCount = getPdfCount();

      const subject = `Meine Versicherungspolicen zur Prüfung (${selected.length} Policen)`;

      let body = `Guten Tag ${advisor.name},\n\nich möchte Ihnen meine Versicherungspolicen zur Prüfung senden.\n\n`;
      body += `Meine Policen (${selected.length}):\n`;
      body += buildPolicySummary();

      if (pdfCount > 0) {
        body += `\n${pdfCount} PDF-${pdfCount === 1 ? 'Dokument' : 'Dokumente'} verfügbar\n`;
      }

      body += `\nAlle Policen ansehen & PDFs herunterladen:\n${shareUrl}\n`;
      body += `(Link gültig für 7 Tage)\n`;

      if (message) {
        body += `\nNachricht: ${message}`;
      }

      body += `\n\nFreundliche Grüsse\n\n(Gesendet über InsuBuddy)`;

      window.open(generateEmailLink(advisor.email, subject, body), '_self');
      onClose();
    } catch (err) {
      console.error('Share Fehler:', err);
      setShareError('Fehler beim Erstellen des Links. Bitte erneut versuchen.');
    } finally {
      setCreating(false);
    }
  };

  const selectedCount = selectedPolicies.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Policen senden
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Wähle Policen und sende sie direkt an <span className="font-semibold">{advisor.name}</span>.
          </p>
        </div>

        {/* Policy List */}
        <div className="flex-1 overflow-y-auto p-5">
          {policies.length === 0 ? (
            <div className="text-center py-8">
              <Shield className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Keine Policen vorhanden</p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Füge zuerst Policen hinzu.</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <button
                onClick={selectAll}
                className={`w-full text-left text-sm font-medium mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
              >
                {selectedPolicies.length === policies.length ? 'Alle abwählen' : 'Alle auswählen'}
              </button>

              <div className="space-y-2">
                {policies.map(policy => {
                  const isSelected = selectedPolicies.includes(policy.id);
                  const hasPdf = policy.file?.data;
                  return (
                    <button
                      key={policy.id}
                      onClick={() => togglePolicy(policy.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isSelected
                          ? darkMode
                            ? 'bg-cyan-900/40 border-cyan-500 border'
                            : 'bg-cyan-50 border-cyan-500 border'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 border hover:bg-gray-650'
                            : 'bg-gray-50 border-gray-200 border hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-white'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <FileText className={`w-5 h-5 flex-shrink-0 ${
                        isSelected ? 'text-cyan-500' : darkMode ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {policy.type || policy.name}
                        </p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {policy.company} {policy.premium ? `• CHF ${policy.premium}` : ''}
                        </p>
                      </div>
                      {hasPdf && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">PDF</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Nachricht */}
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nachricht (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="z.B. Ich möchte meine Policen optimieren..."
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl border text-sm resize-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 placeholder-gray-400'
                  }`}
                />
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {shareError && (
          <div className="px-5">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {shareError}
            </div>
          </div>
        )}

        {/* Footer - Send Buttons */}
        {policies.length > 0 && (
          <div className={`p-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
            {/* WhatsApp */}
            {(advisor.whatsapp || advisor.phone) && (
              <button
                onClick={handleWhatsApp}
                disabled={selectedCount === 0 || creating}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600 text-white"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                {selectedCount > 0
                  ? `${selectedCount} ${selectedCount === 1 ? 'Police' : 'Policen'} via WhatsApp`
                  : 'Policen auswählen'
                }
              </button>
            )}

            {/* Email */}
            {advisor.email && (
              <button
                onClick={handleEmail}
                disabled={selectedCount === 0 || creating}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {selectedCount > 0
                  ? `${selectedCount} ${selectedCount === 1 ? 'Police' : 'Policen'} via E-Mail`
                  : 'Policen auswählen'
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePoliciesModal;
