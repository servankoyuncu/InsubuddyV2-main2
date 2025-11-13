import React, { useState } from 'react';
import { Home, FileText, Camera, Bell, TrendingUp, AlertCircle, CheckCircle, Upload, Plus, ChevronRight, User, Moon, Sun, Globe, X, Clock, Download, QrCode, Fingerprint, Check } from 'lucide-react';

const InsuranceNavigator = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLifeEvent, setShowLifeEvent] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('de');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  const [notificationPreferences, setNotificationPreferences] = useState({
    policy_updates: true,
    life_events: true,
    savings_opportunities: true,
    renewal_reminders: true,
    document_uploads: false,
    security_alerts: true
  });

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', title_key: 'notif_policy_update', time: '2 Std.', read: false },
    { id: 2, type: 'info', title_key: 'notif_document_uploaded', time: '5 Std.', read: false },
    { id: 3, type: 'success', title_key: 'notif_savings_found', time: '1 Tag', read: true },
    { id: 4, type: 'reminder', title_key: 'notif_renewal_reminder', time: '2 Tage', read: true }
  ]);

  const translations = {
    de: {
      app_title: 'VersicherungsAssistent',
      app_subtitle: 'Ihr intelligenter Lebenslagen-Navigator',
      tab_overview: 'Übersicht',
      tab_policies: 'Policen',
      tab_vault: 'Tresor',
      tab_profile: 'Profil',
      active_policies: 'Aktive Policen',
      secured_values: 'Gesicherte Werte',
      recommendations: 'Empfehlungen',
      action_required: 'Handlungsbedarf',
      life_events: 'Lebensereignisse',
      add_event: 'Ereignis hinzufügen',
      policy_overview: 'Policen-Übersicht',
      annual_premium: 'Jährliche Gesamtprämie',
      check_needed: 'Prüfung nötig',
      optimal: 'Optimal',
      coverage: 'Deckung',
      premium: 'Prämie',
      digital_vault: 'Digitaler Tresor',
      secured_values_proof: 'Gesicherte Werte mit Nachweis',
      add_valuable: 'Neuen Wertgegenstand erfassen',
      purchase_date: 'Kaufdatum',
      photo_available: 'Foto vorhanden',
      receipt_saved: 'Beleg gesichert',
      personal_data: 'Persönliche Daten',
      birth_date: 'Geburtsdatum',
      address: 'Adresse',
      phone: 'Telefon',
      edit_data: 'Daten bearbeiten',
      settings: 'Einstellungen',
      dark_mode: 'Dark Mode',
      dark_mode_desc: 'Dunkles Design aktivieren',
      notifications: 'Benachrichtigungen',
      notifications_desc: 'Push-Benachrichtigungen',
      manage_settings: 'Einstellungen verwalten',
      security_privacy: 'Sicherheit & Datenschutz',
      change_password: 'Passwort ändern',
      two_factor: 'Zwei-Faktor-Auth',
      privacy_settings: 'Datenschutz',
      logout: 'Abmelden',
      language: 'Sprache',
      cancel: 'Abbrechen',
      moving: 'Umzug',
      marriage: 'Heirat',
      birth: 'Geburt',
      new_car: 'Neues Auto',
      job_change: 'Jobwechsel',
      house_purchase: 'Hauskauf',
      divorce: 'Scheidung',
      retirement: 'Pensionierung',
      notif_policy_update: 'Hausrat anpassen',
      notif_document_uploaded: 'Dokument hochgeladen',
      notif_savings_found: 'CHF 420 Sparpotenzial',
      notif_renewal_reminder: 'Auto läuft in 30 Tagen ab',
      mark_all_read: 'Alle als gelesen',
      no_notifications: 'Keine Benachrichtigungen',
      household: 'Hausrat',
      car: 'Auto',
      liability: 'Haftpflicht',
      health: 'Krankenkasse',
      filter_all: 'Alle',
      filter_warnings: 'Warnungen',
      filter_reminders: 'Erinnerungen',
      filter_info: 'Info',
      export_data: 'Daten exportieren',
      export_policies: 'Policen PDF',
      export_vault: 'Tresor Excel',
      export_all: 'Alles (ZIP)',
      scan_receipt: 'Beleg scannen',
      qr_scanner: 'QR-Scanner',
      scan_instruction: 'QR-Code im Rahmen positionieren',
      biometric_auth: 'Biometrie',
      biometric_desc: 'Face ID / Fingerabdruck',
      enable_biometric: 'Aktivieren',
      biometric_setup_title: 'Biometrie einrichten',
      biometric_setup_desc: 'Mit Face ID oder Touch ID schützen',
      setup_now: 'Jetzt einrichten',
      notification_settings: 'Benachrichtigungen',
      policy_updates_notif: 'Policen-Updates',
      life_events_notif: 'Lebensereignisse',
      savings_opportunities_notif: 'Sparmöglichkeiten',
      renewal_reminders_notif: 'Verlängerungen',
      document_uploads_notif: 'Dokumente',
      security_alerts_notif: 'Sicherheit',
      save: 'Speichern'
    },
    en: {
      app_title: 'Insurance Assistant',
      app_subtitle: 'Your intelligent life navigator',
      tab_overview: 'Overview',
      tab_policies: 'Policies',
      tab_vault: 'Vault',
      tab_profile: 'Profile',
      active_policies: 'Active Policies',
      secured_values: 'Secured Values',
      recommendations: 'Recommendations',
      action_required: 'Action Required',
      life_events: 'Life Events',
      add_event: 'Add Event',
      policy_overview: 'Policy Overview',
      annual_premium: 'Total Annual Premium',
      check_needed: 'Check Needed',
      optimal: 'Optimal',
      coverage: 'Coverage',
      premium: 'Premium',
      digital_vault: 'Digital Vault',
      secured_values_proof: 'Secured Values',
      add_valuable: 'Add Item',
      purchase_date: 'Purchase Date',
      photo_available: 'Photo Available',
      receipt_saved: 'Receipt Saved',
      personal_data: 'Personal Data',
      birth_date: 'Birth Date',
      address: 'Address',
      phone: 'Phone',
      edit_data: 'Edit Data',
      settings: 'Settings',
      dark_mode: 'Dark Mode',
      dark_mode_desc: 'Enable dark design',
      notifications: 'Notifications',
      notifications_desc: 'Push notifications',
      manage_settings: 'Manage Settings',
      security_privacy: 'Security & Privacy',
      change_password: 'Change Password',
      two_factor: 'Two-Factor Auth',
      privacy_settings: 'Privacy',
      logout: 'Logout',
      language: 'Language',
      cancel: 'Cancel',
      moving: 'Moving',
      marriage: 'Marriage',
      birth: 'Birth',
      new_car: 'New Car',
      job_change: 'Job Change',
      house_purchase: 'House Purchase',
      divorce: 'Divorce',
      retirement: 'Retirement',
      notif_policy_update: 'Update household insurance',
      notif_document_uploaded: 'Document uploaded',
      notif_savings_found: 'CHF 420 savings found',
      notif_renewal_reminder: 'Car insurance expires in 30 days',
      mark_all_read: 'Mark all read',
      no_notifications: 'No notifications',
      household: 'Household',
      car: 'Car',
      liability: 'Liability',
      health: 'Health',
      filter_all: 'All',
      filter_warnings: 'Warnings',
      filter_reminders: 'Reminders',
      filter_info: 'Info',
      export_data: 'Export Data',
      export_policies: 'Policies PDF',
      export_vault: 'Vault Excel',
      export_all: 'All (ZIP)',
      scan_receipt: 'Scan Receipt',
      qr_scanner: 'QR Scanner',
      scan_instruction: 'Position QR-code in frame',
      biometric_auth: 'Biometric',
      biometric_desc: 'Face ID / Fingerprint',
      enable_biometric: 'Enable',
      biometric_setup_title: 'Setup Biometric',
      biometric_setup_desc: 'Protect with Face ID or Touch ID',
      setup_now: 'Setup Now',
      notification_settings: 'Notifications',
      policy_updates_notif: 'Policy Updates',
      life_events_notif: 'Life Events',
      savings_opportunities_notif: 'Savings',
      renewal_reminders_notif: 'Renewals',
      document_uploads_notif: 'Documents',
      security_alerts_notif: 'Security',
      save: 'Save'
    }
  };

  const t = (key) => translations[language][key] || key;

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇨🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const lifeEvents = [
    { id: 1, event: t('moving'), date: '15.03.2025', status: 'pending' },
    { id: 2, event: t('new_car'), date: '01.02.2025', status: 'completed' }
  ];

  const policySuggestions = [
    { 
      type: 'critical', 
      title: 'Hausrat anpassen', 
      description: 'Deckungssumme zu niedrig',
      action: 'CHF 50k auf CHF 75k erhöhen',
      savings: null
    },
    { 
      type: 'opportunity', 
      title: 'Franchise optimieren', 
      description: '3 Jahre keine Schäden',
      action: 'CHF 240/Jahr sparen',
      savings: 240
    }
  ];

  const valuableItems = [
    { id: 1, name: 'MacBook Pro 16"', value: 'CHF 3200', date: '12.01.2024', hasReceipt: true, hasPhoto: true },
    { id: 2, name: 'Rennvelo', value: 'CHF 4500', date: '05.06.2023', hasReceipt: true, hasPhoto: true }
  ];

  const policies = [
    { company: 'Helvetia', type: t('household'), premium: 'CHF 420/Jahr', coverage: 'CHF 50000', status: 'attention' },
    { company: 'AXA', type: t('car'), premium: 'CHF 1200/Jahr', coverage: 'Vollkasko', status: 'ok' }
  ];

  const filteredNotifications = notifications.filter(n => {
    if (notificationFilter === 'all') return true;
    if (notificationFilter === 'warning') return n.type === 'warning';
    if (notificationFilter === 'reminder') return n.type === 'reminder';
    if (notificationFilter === 'info') return n.type === 'info' || n.type === 'success';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'success': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'reminder': return <Clock className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('app_title')}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('app_subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportMenu(true)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLanguageMenu(true)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} relative`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} p-4 rounded-lg`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>2</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('active_policies')}</div>
              </div>
              <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} p-4 rounded-lg`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>2</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('secured_values')}</div>
              </div>
              <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-50'} p-4 rounded-lg`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>2</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('recommendations')}</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('action_required')}</h2>
              </div>
              {policySuggestions.map((s, i) => (
                <div key={i} className={`p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <div className="flex-1">
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.title}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.description}</div>
                      <div className="text-sm text-blue-600 mt-2">{s.action}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">{t('policy_overview')}</h2>
              <div className="text-3xl font-bold">CHF 1620</div>
              <div className="text-sm opacity-90">{t('annual_premium')}</div>
            </div>
            {policies.map((p, i) => (
              <div key={i} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.type}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{p.company}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">{t('digital_vault')}</h2>
              <div className="text-3xl font-bold">CHF 7700</div>
              <div className="text-sm opacity-90">{t('secured_values_proof')}</div>
            </div>
            <button 
              onClick={() => setShowQRScanner(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              {t('scan_receipt')}
            </button>
            {valuableItems.map(item => (
              <div key={item.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>
                <div className="text-lg text-blue-600 font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Max Mustermann</h2>
                  <p className="text-sm">max@email.ch</p>
                </div>
              </div>
            </div>
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
              <button 
                onClick={() => setShowBiometricSetup(true)}
                className="w-full text-left flex items-center justify-between"
              >
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('biometric_auth')}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('biometric_desc')}</div>
                </div>
                {biometricEnabled && <Check className="w-5 h-5 text-green-500" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-4 py-2`}>
        <div className="max-w-4xl mx-auto flex justify-around">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 py-2 px-4 ${activeTab === 'dashboard' ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs">{t('tab_overview')}</span>
          </button>
          <button onClick={() => setActiveTab('policies')} className={`flex flex-col items-center gap-1 py-2 px-4 ${activeTab === 'policies' ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <FileText className="w-6 h-6" />
            <span className="text-xs">{t('tab_policies')}</span>
          </button>
          <button onClick={() => setActiveTab('vault')} className={`flex flex-col items-center gap-1 py-2 px-4 ${activeTab === 'vault' ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Camera className="w-6 h-6" />
            <span className="text-xs">{t('tab_vault')}</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 py-2 px-4 ${activeTab === 'profile' ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <User className="w-6 h-6" />
            <span className="text-xs">{t('tab_profile')}</span>
          </button>
        </div>
      </div>

      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          <div className="text-white mb-6 text-center">
            <h2 className="text-xl font-semibold mb-2">{t('qr_scanner')}</h2>
            <p
            <p className="text-sm opacity-75">{t('scan_instruction')}</p>
          </div>
          <div className="relative w-64 h-64 border-4 border-blue-500 rounded-lg">
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-blue-500 animate-pulse" />
            </div>
          </div>
          <button onClick={() => setShowQRScanner(false)} className="mt-8 px-6 py-2 bg-white text-gray-900 rounded-lg">
            {t('cancel')}
          </button>
        </div>
      )}

      {showBiometricSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full p-6`}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center`}>
                <Fingerprint className={`w-10 h-10 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('biometric_setup_title')}</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('biometric_setup_desc')}</p>
            </div>
            <button onClick={() => { setBiometricEnabled(true); setShowBiometricSetup(false); }} className="w-full bg-blue-600 text-white py-3 rounded-lg mb-3">
              {t('setup_now')}
            </button>
            <button onClick={() => setShowBiometricSetup(false)} className={`w-full py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {showLanguageMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-sm w-full p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('language')}</h2>
            <div className="space-y-2 mb-6">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${
                    language === lang.code ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {language === lang.code && <CheckCircle className="w-5 h-5 ml-auto" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLanguageMenu(false)} className={`w-full py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('notifications')}</h2>
                {unreadCount > 0 && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{unreadCount} neue</p>
                )}
              </div>
              <button onClick={() => setShowNotifications(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`px-4 py-2 flex gap-2 overflow-x-auto ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
              {['all', 'warning', 'reminder', 'info'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setNotificationFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    notificationFilter === filter ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
                  }`}
                >
                  {t(`filter_${filter}`)}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <div className={`px-4 py-2 ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                <button onClick={markAllAsRead} className="text-sm text-blue-600 font-medium">
                  {t('mark_all_read')}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{t('no_notifications')}</p>
                </div>
              ) : (
                <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredNotifications.map(notif => (
                    <div key={notif.id} className={`p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${!notif.read ? (darkMode ? 'bg-gray-750' : 'bg-blue-50') : ''}`}>
                      <div className="flex gap-3">
                        {getNotificationIcon(notif.type)}
                        <div className="flex-1">
                          <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{t(notif.title_key)}</div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{notif.time}</div>
                        </div>
                        {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showExportMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl w-full max-w-md p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('export_data')}</h2>
            <div className="space-y-3">
              <button onClick={() => setShowExportMenu(false)} className={`w-full text-left p-4 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} flex items-center gap-3`}>
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('export_policies')}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>PDF Format</div>
                </div>
              </button>
              <button onClick={() => setShowExportMenu(false)} className={`w-full text-left p-4 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} flex items-center gap-3`}>
                <Download className="w-5 h-5 text-green-600" />
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('export_vault')}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Excel Format</div>
                </div>
              </button>
              <button onClick={() => setShowExportMenu(false)} className={`w-full text-left p-4 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} flex items-center gap-3`}>
                <Download className="w-5 h-5 text-purple-600" />
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('export_all')}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Alle Daten</div>
                </div>
              </button>
            </div>
            <button onClick={() => setShowExportMenu(false)} className={`w-full mt-4 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceNavigator;
