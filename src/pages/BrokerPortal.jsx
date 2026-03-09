import React, { useState } from 'react';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { submitAdvisorApplication, ADVISOR_TOPICS, SWISS_CANTONS } from '../services/advisorService';

const LANGUAGES = ['Deutsch', 'Französisch', 'Italienisch', 'Englisch', 'Portugiesisch', 'Albanisch', 'Türkisch', 'Serbisch'];

const initialForm = {
  name: '', title: '', company: '', photo: '', bio: '',
  topics: [], specializations: '', city: '', canton: '', radius_km: 30,
  email: '', phone: '', whatsapp: '', languages: ['Deutsch'],
};

export default function BrokerPortal() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleTopic = (id) => {
    set('topics', form.topics.includes(id)
      ? form.topics.filter(t => t !== id)
      : [...form.topics, id]);
  };

  const toggleLanguage = (lang) => {
    set('languages', form.languages.includes(lang)
      ? form.languages.filter(l => l !== lang)
      : [...form.languages, lang]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.company) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    const result = await submitAdvisorApplication(payload);
    setLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError('Fehler beim Einreichen. Bitte versuchen Sie es erneut.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bewerbung eingereicht!</h2>
          <p className="text-gray-500 text-sm">
            Vielen Dank für Ihre Einreichung. Wir prüfen Ihre Angaben und melden uns in Kürze bei <strong>{form.email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src="/icons/appstore.png" alt="InsuBuddy" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">InsuBuddy Berater-Portal</h1>
            <p className="text-sm text-gray-500">Berater einreichen für die InsuBuddy App</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-800">
          <strong>So funktioniert es:</strong> Füllen Sie das Formular aus. Wir prüfen die Angaben und schalten den Berater anschliessend in der InsuBuddy App frei.
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Persönliche Angaben */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900 text-base">Persönliche Angaben</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Max Mustermann" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel / Funktion</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Versicherungsberater" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma <span className="text-red-500">*</span></label>
                <input value={form.company} onChange={e => set('company', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Muster AG" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto URL</label>
                <input value={form.photo} onChange={e => set('photo', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://..." type="url" />
                <p className="text-xs text-gray-400 mt-1">Link zu einem Profilfoto (LinkedIn, Website, etc.)</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurzbeschreibung</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                  rows={3} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Kurze Vorstellung des Beraters..." />
              </div>
            </div>
          </section>

          {/* Beratungsthemen */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-900 text-base">Beratungsthemen</h2>
            <div className="grid grid-cols-2 gap-2">
              {ADVISOR_TOPICS.map(topic => (
                <button key={topic.id} type="button" onClick={() => toggleTopic(topic.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    form.topics.includes(topic.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {form.topics.includes(topic.id) && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  {topic.label}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weitere Spezialisierungen</label>
              <input value={form.specializations} onChange={e => set('specializations', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="z.B. Firmenkunden, Expatriates (kommagetrennt)" />
            </div>
          </section>

          {/* Standort */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900 text-base">Standort</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Zürich" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kanton</label>
                <select value={form.canton} onChange={e => set('canton', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Kanton wählen</option>
                  {SWISS_CANTONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tätigkeitsradius: <strong>{form.radius_km} km</strong></label>
                <input type="range" min={5} max={200} step={5} value={form.radius_km}
                  onChange={e => set('radius_km', parseInt(e.target.value))}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5 km</span><span>200 km</span></div>
              </div>
            </div>
          </section>

          {/* Kontakt */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900 text-base">Kontakt</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail <span className="text-red-500">*</span></label>
                <input value={form.email} onChange={e => set('email', e.target.value)}
                  type="email" required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="berater@firma.ch" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+41 79 000 00 00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+41 79 000 00 00" />
              </div>
            </div>
          </section>

          {/* Sprachen */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-900 text-base">Sprachen</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    form.languages.includes(lang)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {lang}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> Wird eingereicht...</> : 'Bewerbung einreichen'}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            Mit dem Einreichen bestätigen Sie, dass alle Angaben korrekt sind.
          </p>
        </form>
      </div>
    </div>
  );
}
