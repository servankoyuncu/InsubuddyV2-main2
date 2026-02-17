import { useState } from 'react';
import { X, Mail, Copy, CheckCircle, FileX } from 'lucide-react';

export default function CancellationModal({ policy, userEmail, onClose, darkMode }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [plz, setPlz] = useState('');
  const [city, setCity] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [cancellationDate, setCancellationDate] = useState(
    policy.expiryDate ? new Date(policy.expiryDate).toISOString().split('T')[0] : ''
  );
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);

  const today = new Date().toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedCancellationDate = cancellationDate
    ? new Date(cancellationDate).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '[Datum]';

  function generateLetter() {
    const lines = [
      name,
      address,
      `${plz} ${city}`,
      '',
      today,
      '',
      policy.company,
      '',
      'Kündigung der Versicherungspolice',
      '',
      `Policen-Nr.: ${policyNumber}`,
      `Versicherungsart: ${policy.type}`,
      `Bezeichnung: ${policy.name}`,
      '',
      'Sehr geehrte Damen und Herren',
      '',
      `Hiermit kündige ich die obengenannte Versicherungspolice ordentlich per ${formattedCancellationDate}.`,
    ];

    if (reason) {
      lines.push('', `Grund: ${reason}`);
    }

    lines.push(
      '',
      `Ich bitte Sie um eine schriftliche Bestätigung der Kündigung an obenstehende Adresse oder per E-Mail an ${userEmail || '[Ihre E-Mail]'}.`,
      '',
      'Freundliche Grüsse',
      '',
      name
    );

    return lines.join('\n');
  }

  function isFormValid() {
    return name.trim() && address.trim() && plz.trim() && city.trim() && policyNumber.trim() && cancellationDate;
  }

  function handleSendEmail() {
    const letter = generateLetter();
    const subject = `Kündigung Versicherungspolice ${policyNumber} - ${policy.type}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}`;
  }

  function handleCopy() {
    const letter = generateLetter();
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm ${
    darkMode
      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const readonlyClass = `w-full px-3 py-2 rounded-xl border text-sm ${
    darkMode
      ? 'bg-gray-700/30 border-gray-600/50 text-gray-400'
      : 'bg-gray-100 border-gray-200 text-gray-500'
  }`;

  const labelClass = `block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-scaleIn ${
          darkMode ? 'bg-gray-800/95 border-gray-700/50' : 'bg-white/95 border-gray-200/50'
        } backdrop-blur-xl border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <FileX className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Kündigungsassistent
            </h2>
          </div>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Versicherungsinfo (readonly) */}
          <div className={`rounded-xl p-3 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Versicherung</p>
            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{policy.company}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{policy.type} — {policy.name}</p>
          </div>

          {/* Policennummer */}
          <div>
            <label className={labelClass}>Policennummer *</label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="z.B. 12-345-678"
              className={inputClass}
            />
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Vor- und Nachname *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Muster"
              className={inputClass}
            />
          </div>

          {/* Adresse */}
          <div>
            <label className={labelClass}>Strasse und Hausnummer *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Musterstrasse 12"
              className={inputClass}
            />
          </div>

          {/* PLZ + Ort */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelClass}>PLZ *</label>
              <input
                type="text"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                placeholder="8000"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Ort *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Zürich"
                className={inputClass}
              />
            </div>
          </div>

          {/* Kündigungsdatum */}
          <div>
            <label className={labelClass}>Kündigung per *</label>
            <input
              type="date"
              value={cancellationDate}
              onChange={(e) => setCancellationDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Grund (optional) */}
          <div>
            <label className={labelClass}>Kündigungsgrund (optional)</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
            >
              <option value="">— Kein Grund angeben —</option>
              <option value="Nicht mehr benötigt">Nicht mehr benötigt</option>
              <option value="Besseres Angebot gefunden">Besseres Angebot gefunden</option>
              <option value="Umzug">Umzug</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>

          {/* Vorschau */}
          {isFormValid() && (
            <div>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vorschau</p>
              <pre className={`text-xs whitespace-pre-wrap rounded-xl p-3 max-h-48 overflow-y-auto ${
                darkMode ? 'bg-gray-700/30 text-gray-300' : 'bg-gray-50 text-gray-700'
              }`}>
                {generateLetter()}
              </pre>
            </div>
          )}

          {/* Aktionen */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSendEmail}
              disabled={!isFormValid()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <Mail className="w-4 h-4" />
              Per E-Mail senden
            </button>
            <button
              onClick={handleCopy}
              disabled={!isFormValid()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium border transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Brief kopieren
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
