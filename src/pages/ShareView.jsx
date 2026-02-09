import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, FileText, Download, Clock, AlertCircle, Calendar } from 'lucide-react';
import { getShareByCode } from '../services/shareService';

function ShareView() {
  const { code } = useParams();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadShare = async () => {
      try {
        const data = await getShareByCode(code);
        if (data) {
          setShare(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Fehler beim Laden:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (code) loadShare();
  }, [code]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Policen werden geladen...</p>
        </div>
      </div>
    );
  }

  // Fehler / Abgelaufen
  if (error || !share) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">InsuBuddy</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Clock className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Link abgelaufen oder ungültig
            </h2>
            <p className="text-gray-600">
              Dieser Sharing-Link ist nicht mehr gültig. Bitte den Versender kontaktieren, um einen neuen Link zu erhalten.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const policies = share.policy_data || [];
  const pdfCount = policies.filter(p => p.file?.data).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">InsuBuddy</h1>
          <p className="text-gray-500 text-sm mt-1">Geteilte Versicherungspolicen</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 text-white">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-lg">
                  {policies.length} {policies.length === 1 ? 'Police' : 'Policen'}
                </p>
                {pdfCount > 0 && (
                  <p className="text-cyan-100 text-sm">
                    {pdfCount} PDF-{pdfCount === 1 ? 'Dokument' : 'Dokumente'} verfügbar
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-cyan-100 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Gültig bis {formatDate(share.expires_at)}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Nachricht */}
            {share.message && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-blue-800 mb-1">Nachricht:</p>
                <p className="text-blue-700 text-sm">{share.message}</p>
              </div>
            )}

            {/* Policen Liste */}
            <div className="space-y-3">
              {policies.map((policy, idx) => (
                <div key={policy.id || idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {policy.type || policy.name}
                      </h3>
                      <p className="text-sm text-gray-500">{policy.company}</p>

                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {policy.premium && (
                          <span className="text-sm font-medium text-gray-700">
                            CHF {policy.premium}/Jahr
                          </span>
                        )}
                        {policy.expiryDate && (
                          <span className="text-xs text-gray-400">
                            Ablauf: {formatDate(policy.expiryDate)}
                          </span>
                        )}
                      </div>

                      {/* Deckung Tags */}
                      {policy.coverage && policy.coverage.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {policy.coverage.map((item, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PDF Download */}
                  {policy.file?.data && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <a
                        href={policy.file.data}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
                      >
                        <Download className="w-4 h-4" />
                        {policy.file.name || 'PDF herunterladen'}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pb-6">
          <p className="text-sm text-gray-400">
            Powered by InsuBuddy
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShareView;
