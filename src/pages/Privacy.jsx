import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-gray-500 mb-8">Stand: März 2026</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-900 mb-2">1. Verantwortliche Stelle</h2>
            <p>Verantwortlich für die Datenverarbeitung in der App InsuBuddy ist Servan Koyuncu, Schweiz. Kontakt: support@insubuddy.app</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">2. Erhobene Daten</h2>
            <p>Wir verarbeiten folgende Daten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>E-Mail-Adresse und Passwort (bei Registrierung)</li>
              <li>Hochgeladene Versicherungsdokumente (PDF)</li>
              <li>Manuell eingegebene Versicherungsdaten</li>
              <li>Solana-Wallet-Adresse (bei Wallet-Login)</li>
              <li>Push-Notification-Token (bei Nutzung auf iOS)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">3. Zweck der Datenverarbeitung</h2>
            <p>Ihre Daten werden ausschliesslich zur Bereitstellung der App-Funktionen verwendet: Verwaltung Ihrer Versicherungspolicen, KI-gestützte Analyse, Benachrichtigungen zu ablaufenden Policen und Premium-Abonnement-Verwaltung.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">4. Datenspeicherung</h2>
            <p>Ihre Daten werden sicher auf Servern von Supabase (EU-Region) gespeichert. PDF-Dokumente werden verschlüsselt im Supabase Storage abgelegt. Wir geben keine Daten an Dritte weiter.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">5. KI-Assistent</h2>
            <p>Der KI-Versicherungsassistent nutzt die Claude API von Anthropic. Dabei werden Ihre Policendaten zur Beantwortung Ihrer Fragen an die API übertragen. Anthropic speichert diese Daten gemäss ihrer eigenen Datenschutzrichtlinie.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">6. In-App-Käufe</h2>
            <p>Premium-Abonnements werden über Apple In-App Purchase abgewickelt. Die Zahlungsabwicklung erfolgt ausschliesslich über Apple. Wir erhalten keine Zahlungsdaten.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">7. Ihre Rechte</h2>
            <p>Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten. Zur Löschung Ihres Kontos nutzen Sie die Funktion «Konto löschen» in den Einstellungen oder kontaktieren Sie uns unter support@insubuddy.app.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">8. Kontakt</h2>
            <p>Bei Fragen zum Datenschutz: support@insubuddy.app</p>
          </section>
        </div>
      </div>
    </div>
  );
}
