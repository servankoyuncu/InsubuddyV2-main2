import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nutzungsbedingungen</h1>
        <p className="text-sm text-gray-500 mb-8">Stand: März 2026</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-900 mb-2">1. Geltungsbereich</h2>
            <p>Diese Nutzungsbedingungen gelten für die Nutzung der App InsuBuddy (nachfolgend «App»). Durch die Nutzung der App akzeptieren Sie diese Bedingungen.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">2. Leistungsbeschreibung</h2>
            <p>InsuBuddy ist eine persönliche Versicherungsverwaltungs-App. Sie ermöglicht das Erfassen, Verwalten und Analysieren von Versicherungspolicen. Die KI-gestützte Analyse dient als Informationshilfe und ersetzt keine professionelle Versicherungsberatung.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">3. Premium-Abonnement</h2>
            <p>InsuBuddy Premium wird als automatisch verlängerbares Abonnement angeboten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Monatlich:</strong> CHF 4.– pro Monat</li>
              <li><strong>Jährlich:</strong> CHF 39.– pro Jahr (CHF 3.25 / Monat)</li>
            </ul>
            <p className="mt-2">Das Abonnement verlängert sich automatisch, sofern es nicht mindestens 24 Stunden vor Ende des aktuellen Zeitraums gekündigt wird. Die Kündigung erfolgt über die Apple ID Einstellungen.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">4. Zahlung</h2>
            <p>Die Zahlung wird über Ihr Apple ID-Konto abgerechnet. Mit der Bestätigung des Kaufs autorisieren Sie Apple, den entsprechenden Betrag zu belasten.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">5. Haftungsausschluss</h2>
            <p>Die App dient ausschliesslich der persönlichen Verwaltung von Versicherungsinformationen. Wir übernehmen keine Haftung für die Vollständigkeit oder Richtigkeit der angezeigten Informationen. Die App ersetzt keine Rechts- oder Versicherungsberatung.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">6. Nutzerpflichten</h2>
            <p>Sie verpflichten sich, die App nur für rechtmässige Zwecke zu nutzen und keine falschen Angaben zu machen. Das Hochladen von Dokumenten Dritter ohne deren Einwilligung ist untersagt.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">7. Änderungen</h2>
            <p>Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Wesentliche Änderungen werden über die App kommuniziert.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">8. Anwendbares Recht</h2>
            <p>Es gilt Schweizer Recht. Gerichtsstand ist die Schweiz.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">9. Kontakt</h2>
            <p>info@insubuddy.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
