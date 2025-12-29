import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Camera, Bell, TrendingUp, AlertCircle, CheckCircle, Upload, Plus, ChevronRight, User, Moon, Sun, Globe, X, Clock, Download, QrCode, Fingerprint, Check, Shield, ExternalLink, Star, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addPolicy, getUserPolicies, deletePolicy } from '../services/policyservice';
import { getNotificationSettings, checkExpiringPolicies } from '../services/notificationService';
import { addValuableItem, getUserValuableItems, deleteValuableItem, calculateTotalValue } from '../services/valuableItemsService';
import { getActiveAdminNotifications } from '../services/adminNotificationService';
import { useAdmin } from '../hooks/useAdmin';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Deckungen-Templates mit detaillierten Beschreibungen
const coverageTemplates = {
  'Hausrat': [
    { 
      name: 'Feuer & Explosion', 
      description: 'Deckt Schäden durch Brand, plötzliche Rauchentwicklung, Blitzschlag, Explosionen sowie abstürzende Luft-/Raumfahrzeuge.' 
    },
    { 
      name: 'Einbruch & Diebstahl', 
      description: 'Deckt Diebstahl von Sachen aus verschlossenen Räumen unter Anwendung von Gewalt (Aufbrechen von Türen/Fenstern) sowie Beraubung unter Androhung oder Anwendung von Gewalt gegen Personen.' 
    },
    { 
      name: 'Leitungswasser', 
      description: 'Zahlt bei Schäden durch austretendes Leitungswasser (Rohrbruch), Regen-, Schnee- und Schmelzwasser, das ins Haus dringt, sowie bei Rückstau der Kanalisation oder Wasser aus Aquarien/Wasserbetten.' 
    },
    { 
      name: 'Sturm & Hagel', 
      description: 'Deckt Schäden durch Sturm (Wind ab 75 km/h) und Hagel an Ihrem Hausrat.' 
    },
    { 
      name: 'Elementarschäden', 
      description: 'Deckt Schäden durch weitere Naturgewalten wie Hochwasser, Überschwemmung, Lawinen, Schneedruck, Felssturz, Steinschlag und Erdrutsch.' 
    },
    { 
      name: 'Glasbruch', 
      description: 'Ersatz von zerbrochenen Scheiben, Glaskeramik-Kochfeldern, Glasmöbeln und Aquarien.' 
    },
    { 
      name: 'Fahrraddiebstahl', 
      description: 'Deckt den Diebstahl von Fahrrädern ausserhalb der Wohnung (oft als Zusatzdeckung).' 
    }
  ],
  'Haftpflicht': [
    { 
      name: 'Personenschäden', 
      description: 'Übernahme von Kosten bei Verletzung oder Tötung von Personen (Heilungskosten, Erwerbsausfall, Genugtuung).' 
    },
    { 
      name: 'Sachschäden', 
      description: 'Bezahlung der Reparatur oder des Zeitwerts von Gegenständen, die Sie Dritten unabsichtlich beschädigt oder zerstört haben.' 
    },
    { 
      name: 'Vermögensschäden', 
      description: 'Deckt finanzielle Schäden, die Dritten durch Ihr Verhalten entstehen, ohne dass eine Person verletzt oder eine Sache beschädigt wurde.' 
    },
    { 
      name: 'Schlüsselverlust', 
      description: 'Übernahme der Kosten für den Ersatz von Schlössern und Schlüsseln bei Verlust von fremden Schlüsseln (z.B. Mietwohnung, Arbeitgeber).' 
    },
    { 
      name: 'Gefälligkeitsschäden', 
      description: 'Deckt Schäden, die Sie bei unentgeltlichen Hilfeleistungen (z.B. beim Umzug helfen) verursachen.' 
    }
  ],
  'Auto': [
    { 
      name: 'Haftpflicht', 
      description: 'Obligatorisch: Deckt Personen- und Sachschäden, die Sie mit Ihrem Fahrzeug anderen zufügen.' 
    },
    { 
      name: 'Teilkasko', 
      description: 'Deckt Diebstahl des Fahrzeugs, Elementarschäden (Hagel, Sturm, Hochwasser, Brand), Glasbruch (Scheiben) und Schäden durch Marder/Tiere.' 
    },
    { 
      name: 'Vollkasko', 
      description: 'Enthält alle Teilkasko-Leistungen plus Kollisionsschäden (selbstverschuldete Unfälle oder Schäden durch Unbekannte am eigenen Auto).' 
    },
    { 
      name: 'Pannenhilfe', 
      description: 'Organisation und Kostenübernahme bei Fahrzeugpannen, Abschleppdienst und Weiterreise.' 
    },
    { 
      name: 'Insassenschutz', 
      description: 'Versicherung für Verletzungen der Insassen bei Unfällen, unabhängig von der Schuldfrage.' 
    },
    { 
      name: 'Rechtsschutz', 
      description: 'Übernahme von Anwalts- und Prozesskosten bei rechtlichen Streitigkeiten rund ums Fahrzeug.' 
    }
  ],
  'Krankenkasse': [
    { 
      name: 'Grundversicherung', 
      description: 'Obligatorische Krankenpflegeversicherung: Deckt ambulante Leistungen (Arztbesuche, Medikamente, Analysen), stationäre Leistungen (Spitalaufenthalt allgemeine Abteilung) und Spitex/Pflege gemäss Gesetz.' 
    },
    { 
      name: 'Zahnzusatz', 
      description: 'Beteiligung an Kosten für Zahnbehandlungen, Kieferorthopädie und Dentalhygiene (nicht in Grundversicherung enthalten).' 
    },
    { 
      name: 'Spitalzusatz', 
      description: 'Upgrade auf halbprivate oder private Abteilung im Spital, freie Spital- und Arztwahl.' 
    },
    { 
      name: 'Alternative Medizin', 
      description: 'Übernahme von Kosten für komplementärmedizinische Behandlungen (Naturheilkunde, TCM, Homöopathie etc.).' 
    },
    { 
      name: 'Brillen/Linsen', 
      description: 'Beteiligung an Kosten für Brillen, Kontaktlinsen und Augenlaser-Operationen.' 
    }
  ],
  'Gebäude': [
    { 
      name: 'Feuer & Elementar', 
      description: '(In fast allen Kantonen obligatorisch über die kantonale Versicherung) Deckt Schäden am Gebäude durch Brand, Blitz, Sturm, Hagel etc.' 
    },
    { 
      name: 'Gebäudewasser', 
      description: 'Deckt Schäden durch defekte Leitungen innerhalb des Gebäudes, Frostschäden oder Schäden durch Regenwasser vom Dach.' 
    },
    { 
      name: 'Gebäudehaftpflicht', 
      description: 'Schützt den Eigentümer, wenn z. B. ein Ziegel vom Dach fällt und einen Passanten verletzt oder ein Auto beschädigt.' 
    }
  ],
  'Rechtsschutz': [
    { 
      name: 'Privatrechtsschutz', 
      description: 'Übernahme von Anwalts- und Prozesskosten bei Streitigkeiten als Privatperson (z. B. mit dem Arbeitgeber, dem Vermieter oder bei Kaufverträgen).' 
    },
    { 
      name: 'Verkehrsrechtsschutz', 
      description: 'Rechtliche Unterstützung bei Streitigkeiten nach Unfällen, Problemen beim Fahrzeugkauf oder drohendem Entzug des Führerausweises.' 
    }
  ],
  'Reise': [
    { 
      name: 'Annullierungskosten', 
      description: 'Übernahme der Kosten, wenn eine Reise wegen Krankheit, Unfall oder Schwangerschaft nicht angetreten werden kann.' 
    },
    { 
      name: 'Personen-Assistance', 
      description: 'Organisation und Bezahlung von Nottransports, Such- und Rettungsaktionen sowie vorzeitiger Rückreise im Notfall.' 
    }
  ]
};

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('de');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Policen State
  const [policies, setPolicies] = useState([]);
  const [policyName, setPolicyName] = useState('');
  const [policyCompany, setPolicyCompany] = useState('');
  const [policyType, setPolicyType] = useState('');
  const [policyPremium, setPolicyPremium] = useState('');
  const [policyExpiryDate, setPolicyExpiryDate] = useState('');
  const [policyCoverage, setPolicyCoverage] = useState([]);
  const [expandedPolicies, setExpandedPolicies] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Info-Tooltip State
  const [showCoverageInfo, setShowCoverageInfo] = useState(null);
  
  // Wertgegenstände State
  const [valuableItems, setValuableItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemValue, setItemValue] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemPurchaseDate, setItemPurchaseDate] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState(null);
  
  // Benachrichtigungs State
  const [notificationSettings, setNotificationSettings] = useState({ enabled: true, reminderDays: 30 });
  const [autoNotifications, setAutoNotifications] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [readAdminNotifications, setReadAdminNotifications] = useState([]);
  
  // Partner-Versicherungen State
  const [partnerInsurances, setPartnerInsurances] = useState([]);
  
  const [notifications, setNotifications] = useState([]);

  // Kategorien
  const categories = [
    { value: 'auto', label: 'Kfz-Versicherung' },
    { value: 'health', label: 'Krankenversicherung' },
    { value: 'household', label: 'Hausratversicherung' },
    { value: 'life', label: 'Lebensversicherung' },
    { value: 'liability', label: 'Haftpflichtversicherung' },
    { value: 'legal', label: 'Rechtsschutzversicherung' },
    { value: 'travel', label: 'Reiseversicherung' },
    { value: 'pet', label: 'Tierversicherung' }
  ];

  // Policen laden beim Start
  useEffect(() => {
    const loadPolicies = async () => {
      if (currentUser) {
        try {
          const userPolicies = await getUserPolicies(currentUser.uid);
          setPolicies(userPolicies);
        } catch (error) {
          console.error('Fehler beim Laden der Policen:', error);
        }
      }
    };
    loadPolicies();
  }, [currentUser]);

  // Partner-Versicherungen laden
  useEffect(() => {
    const loadPartnerInsurances = async () => {
      try {
        const q = query(
          collection(db, 'partnerInsurances'),
          where('status', '==', 'published'),
          orderBy('displayOrder', 'asc')
        );
        const snapshot = await getDocs(q);
        const partners = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPartnerInsurances(partners);
      } catch (error) {
        console.error('Fehler beim Laden der Partner:', error);
      }
    };
    
    loadPartnerInsurances();
  }, []);

  // Wertgegenstände laden beim Start
  useEffect(() => {
    const loadItems = async () => {
      if (currentUser) {
        try {
          const items = await getUserValuableItems(currentUser.uid);
          setValuableItems(items);
        } catch (error) {
          console.error('Fehler beim Laden der Wertgegenstände:', error);
        }
      }
    };
    loadItems();
  }, [currentUser]);

  // Benachrichtigungs-Einstellungen laden
  useEffect(() => {
    const loadSettings = async () => {
      if (currentUser) {
        const settings = await getNotificationSettings(currentUser.uid);
        setNotificationSettings(settings);
      }
    };
    loadSettings();
  }, [currentUser]);

  // Admin Notifications laden
  useEffect(() => {
    const loadAdminNotifications = async () => {
      console.log('🔍 Lade Admin Notifications...');
      const adminNotifs = await getActiveAdminNotifications();
      console.log('📢 Admin Notifications geladen:', adminNotifs);
      setAdminNotifications(adminNotifs);
    };
    loadAdminNotifications();
  }, []);

  // Gelesene Admin Notifications aus localStorage laden
  useEffect(() => {
    try {
      const read = localStorage.getItem('readAdminNotifications');
      if (read) {
        setReadAdminNotifications(JSON.parse(read));
      }
    } catch (error) {
      console.error('Fehler beim Laden der gelesenen Notifications:', error);
    }
  }, []);

  // Automatische Benachrichtigungen generieren wenn Policen oder Einstellungen sich ändern
  useEffect(() => {
    if (notificationSettings.enabled && policies.length > 0) {
      const newNotifications = checkExpiringPolicies(policies, notificationSettings.reminderDays);
      setAutoNotifications(newNotifications);
    } else {
      setAutoNotifications([]);
    }
  }, [policies, notificationSettings]);

  const translations = {
    de: {
      app_title: 'InsuBuddy',
      app_subtitle: 'Ihr intelligenter Lebenslagen-Navigator',
      tab_overview: 'Übersicht',
      tab_policies: 'Policen',
      tab_vault: 'Tresor',
      tab_profile: 'Profil',
      active_policies: 'Aktive Policen',
      secured_values: 'Gesicherte Werte',
      recommendations: 'Empfehlungen',
      action_required: 'Handlungsbedarf',
      policy_overview: 'Policen-Übersicht',
      annual_premium: 'Jährliche Gesamtprämie',
      check_needed: 'Prüfung nötig',
      optimal: 'Optimal',
      coverage: 'Deckung',
      premium: 'Prämie',
      digital_vault: 'Digitaler Tresor',
      secured_values_proof: 'Gesicherte Werte mit Nachweis',
      language: 'Sprache',
      cancel: 'Abbrechen',
      mark_all_read: 'Alle als gelesen',
      no_notifications: 'Keine Benachrichtigungen',
      household: 'Hausrat',
      car: 'Auto',
      liability: 'Haftpflicht',
      health: 'Krankenkasse',
      filter_all: 'Alle',
      filter_warning: 'Warnungen',
      filter_reminder: 'Erinnerungen',
      filter_info: 'Info',
      export_data: 'Daten exportieren',
      export_policies: 'Policen PDF',
      export_vault: 'Tresor Excel',
      export_all: 'Alles',
      scan_receipt: 'Beleg scannen',
      qr_scanner: 'QR-Scanner',
      scan_instruction: 'QR-Code positionieren',
      biometric_auth: 'Biometrie',
      biometric_desc: 'Face ID aktivieren',
      biometric_setup_title: 'Biometrie einrichten',
      biometric_setup_desc: 'Mit Face ID schützen',
      setup_now: 'Jetzt einrichten',
      save: 'Speichern',
      add_policy: 'Police hinzufügen',
      upload_policy_pdf: 'Police hochladen',
      select_pdf: 'PDF auswählen',
      or_drag_drop: 'oder hierher ziehen',
      policy_name: 'Policen-Name',
      policy_company: 'Versicherung',
      policy_type: 'Typ',
      select_type: 'Typ auswählen',
      notifications: 'Benachrichtigungen',
      notif_policy_update: 'Hausrat anpassen',
      notif_document_uploaded: 'Dokument hochgeladen',
      notif_savings_found: 'CHF 420 Sparpotenzial',
      notif_renewal_reminder: 'Auto läuft ab'
    },
    en: {
      app_title: 'InsuBuddy',
      app_subtitle: 'Your intelligent navigator',
      tab_overview: 'Overview',
      tab_policies: 'Policies',
      tab_vault: 'Vault',
      tab_profile: 'Profile',
      active_policies: 'Active Policies',
      secured_values: 'Secured Values',
      recommendations: 'Recommendations',
      action_required: 'Action Required',
      policy_overview: 'Policy Overview',
      annual_premium: 'Annual Premium',
      check_needed: 'Check Needed',
      optimal: 'Optimal',
      coverage: 'Coverage',
      premium: 'Premium',
      digital_vault: 'Digital Vault',
      secured_values_proof: 'Secured Values',
      language: 'Language',
      cancel: 'Cancel',
      mark_all_read: 'Mark all read',
      no_notifications: 'No notifications',
      household: 'Household',
      car: 'Car',
      liability: 'Liability',
      health: 'Health',
      filter_all: 'All',
      filter_warning: 'Warnings',
      filter_reminder: 'Reminders',
      filter_info: 'Info',
      export_data: 'Export Data',
      export_policies: 'Policies PDF',
      export_vault: 'Vault Excel',
      export_all: 'All',
      scan_receipt: 'Scan Receipt',
      qr_scanner: 'QR Scanner',
      scan_instruction: 'Position QR-code',
      biometric_auth: 'Biometric',
      biometric_desc: 'Enable Face ID',
      biometric_setup_title: 'Setup Biometric',
      biometric_setup_desc: 'Protect with Face ID',
      setup_now: 'Setup Now',
      save: 'Save',
      add_policy: 'Add Policy',
      upload_policy_pdf: 'Upload Policy',
      select_pdf: 'Select PDF',
      or_drag_drop: 'or drag here',
      policy_name: 'Policy Name',
      policy_company: 'Company',
      policy_type: 'Type',
      select_type: 'Select type',
      notifications: 'Notifications',
      notif_policy_update: 'Update insurance',
      notif_document_uploaded: 'Document uploaded',
      notif_savings_found: 'CHF 420 savings',
      notif_renewal_reminder: 'Car expires soon'
    }
  };

  const t = (key) => translations[language][key] || key;

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇨🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  // Alle Benachrichtigungen zusammenführen
  const allNotifications = [
    ...adminNotifications
      .filter(n => !readAdminNotifications.includes(n.id)) // Nur ungelesene
      .map(n => ({
        id: `admin-${n.id}`,
        adminId: n.id,
        type: n.type,
        title_key: n.title,
        message: n.message,
        time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' }) : 'Neu',
        read: false,
        isAdmin: true
      })),
    ...autoNotifications.map(n => ({
      id: n.id,
      type: n.type === 'critical' ? 'warning' : n.type,
      title_key: n.title,
      message: n.message,
      time: 'Neu',
      read: false,
      isAuto: true
    })),
    ...notifications
  ];

  console.log('🔔 Alle Notifications:', allNotifications);
  console.log('📢 Admin Notifications State:', adminNotifications);

  const filteredNotifications = allNotifications.filter(n => {
    if (notificationFilter === 'all') return true;
    if (notificationFilter === 'warning') return n.type === 'warning';
    if (notificationFilter === 'reminder') return n.type === 'reminder';
    if (notificationFilter === 'info') return n.type === 'info' || n.type === 'success';
    return true;
  });

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setAutoNotifications(autoNotifications.map(n => ({ ...n, read: true })));
  };

  // Admin Notification als gelesen markieren
  const markAdminNotificationAsRead = (notificationId) => {
    const newRead = [...readAdminNotifications, notificationId];
    setReadAdminNotifications(newRead);
    localStorage.setItem('readAdminNotifications', JSON.stringify(newRead));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    } else {
      alert('Bitte wählen Sie eine PDF-Datei aus');
    }
  };

  const handleSavePolicy = async () => {
    if (!policyName || !policyCompany || !policyType) {
      alert('Bitte füllen Sie alle Felder aus');
      return;
    }

    setLoading(true);
    try {
      const policyData = {
        name: policyName,
        company: policyCompany,
        type: policyType,
        premium: policyPremium ? `CHF ${policyPremium}/Jahr` : 'CHF 0/Jahr',
        expiryDate: policyExpiryDate || null,
        coverage: policyCoverage,
        status: 'ok'
      };

      await addPolicy(currentUser.uid, policyData, uploadedFile);
      
      // Policen neu laden
      const updatedPolicies = await getUserPolicies(currentUser.uid);
      setPolicies(updatedPolicies);
      
      // Formular zurücksetzen
      setPolicyName('');
      setPolicyCompany('');
      setPolicyType('');
      setPolicyPremium('');
      setPolicyExpiryDate('');
      setPolicyCoverage([]);
      setUploadedFile(null);
      setShowAddPolicy(false);
      
      alert('Police erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Police');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm('Möchten Sie diese Police wirklich löschen?')) {
      return;
    }

    try {
      await deletePolicy(policyId);
      
      // Policen neu laden
      const updatedPolicies = await getUserPolicies(currentUser.uid);
      setPolicies(updatedPolicies);
      
      alert('Police erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Police');
    }
  };

  const handleViewPDF = (policy) => {
    if (policy.file && policy.file.data) {
      setSelectedPDF(policy);
      setShowPDFViewer(true);
    } else {
      alert('Kein PDF für diese Police vorhanden');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setItemImage(file);
      // Vorschau erstellen
      const reader = new FileReader();
      reader.onload = (e) => setItemImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      alert('Bitte wählen Sie ein Bild aus (JPG, PNG, etc.)');
    }
  };

  const handleSaveItem = async () => {
    if (!itemName || !itemValue || !itemCategory || !itemImage) {
      alert('Bitte füllen Sie alle Felder aus und laden Sie ein Bild hoch');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        name: itemName,
        value: itemValue,
        category: itemCategory,
        purchaseDate: itemPurchaseDate || null
      };

      await addValuableItem(currentUser.uid, itemData, itemImage);
      
      // Items neu laden
      const updatedItems = await getUserValuableItems(currentUser.uid);
      setValuableItems(updatedItems);
      
      // Formular zurücksetzen
      setItemName('');
      setItemValue('');
      setItemCategory('');
      setItemPurchaseDate('');
      setItemImage(null);
      setItemImagePreview(null);
      setShowAddItem(false);
      
      alert('Wertgegenstand erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Wertgegenstands');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Möchten Sie diesen Wertgegenstand wirklich löschen?')) {
      return;
    }

    try {
      await deleteValuableItem(itemId);
      
      // Items neu laden
      const updatedItems = await getUserValuableItems(currentUser.uid);
      setValuableItems(updatedItems);
      
      alert('Wertgegenstand erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Wertgegenstands');
    }
  };

  const handleViewImage = (item) => {
    setSelectedImage(item);
    setShowImageViewer(true);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'success': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'reminder': return <Clock className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5" />;
    }
  }

  // Berechne jährliche Gesamtprämie
  const calculateTotalAnnualPremium = () => {
    return policies.reduce((sum, p) => {
      const premiumMatch = p.premium?.match(/(\d+)/);
      const premium = premiumMatch ? parseInt(premiumMatch[0]) : 0;
      return sum + premium;
    }, 0);
  };

  // Berechne monatliche Prämie pro Police
  const getPremiumBreakdown = () => {
    return policies.map(p => {
      const premiumMatch = p.premium?.match(/(\d+)/);
      const annualPremium = premiumMatch ? parseInt(premiumMatch[0]) : 0;
      const monthlyPremium = Math.round(annualPremium / 12);
      return {
        type: p.type,
        monthly: monthlyPremium,
        annual: annualPremium
      };
    }).filter(p => p.monthly > 0);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return null;
    if (days < 0) return { text: 'Abgelaufen', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (days <= 30) return { text: `${days} Tage`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (days <= 90) return { text: `${days} Tage`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { text: `${days} Tage`, color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  // Hilfsfunktion um Coverage-Beschreibung zu finden
  const getCoverageDescription = (policyType, coverageName) => {
    const template = coverageTemplates[policyType];
    if (!template) return null;
    const coverage = template.find(c => c.name === coverageName);
    return coverage ? coverage.description : null;
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
            <button onClick={() => setShowExportMenu(true)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Download className="w-5 h-5" />
            </button>
            <button onClick={() => setShowLanguageMenu(true)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Globe className="w-5 h-5" />
            </button>
            <button onClick={() => setShowNotifications(true)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} relative`}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
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
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{policies.length}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('active_policies')}</div>
              </div>
              <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} p-4 rounded-lg`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  {policies.filter(p => p.file).length}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mit PDF</div>
              </div>
              <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-50'} p-4 rounded-lg`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                  {policies.filter(p => getDaysUntilExpiry(p.expiryDate) <= 30 && getDaysUntilExpiry(p.expiryDate) >= 0).length}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Laufen bald ab</div>
              </div>
            </div>

            {policies.filter(p => getDaysUntilExpiry(p.expiryDate) <= 30 && getDaysUntilExpiry(p.expiryDate) >= 0).length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>⚠️ Ablaufende Policen</h2>
                </div>
                {policies.filter(p => getDaysUntilExpiry(p.expiryDate) <= 30 && getDaysUntilExpiry(p.expiryDate) >= 0).map((policy, i) => (
                  <div key={i} className={`p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{policy.type} - {policy.company}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Läuft in {getDaysUntilExpiry(policy.expiryDate)} Tagen ab
                        </div>
                        <div className="text-sm text-blue-600 mt-2">Jetzt verlängern</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats Kachel */}
            {policies.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                <h2 className={`font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 Deine Versicherungen {new Date().getFullYear()}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Jährliche Kosten</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      CHF {calculateTotalAnnualPremium().toLocaleString('de-CH')}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pro Monat</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      CHF {Math.round(calculateTotalAnnualPremium() / 12).toLocaleString('de-CH')}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Aktive Policen</div>
                    <div className={`text-2xl font-bold text-blue-600`}>{policies.length}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dokumentiert</div>
                    <div className={`text-2xl font-bold text-green-600`}>
                      {policies.filter(p => p.file).length}/{policies.length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prämien-Vergleich mit Balken */}
            {getPremiumBreakdown().length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                <h2 className={`font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  💳 Monatliche Prämien-Übersicht
                </h2>
                <div className="space-y-4">
                  {getPremiumBreakdown().map((item, idx) => {
                    const maxMonthly = Math.max(...getPremiumBreakdown().map(p => p.monthly));
                    const percentage = (item.monthly / maxMonthly) * 100;
                    
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {item.type}
                          </span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            CHF {item.monthly}
                          </span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total pro Monat: <span className="font-bold">CHF {getPremiumBreakdown().reduce((sum, p) => sum + p.monthly, 0).toLocaleString('de-CH')}</span>
                </div>
              </div>
            )}

            {/* Empfohlene Versicherungen */}
            {partnerInsurances.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                <h2 className={`font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎯 Empfohlene Versicherungen
                </h2>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ausgewählte Partner-Angebote für Sie
                </p>
                <div className="space-y-3">
                  {partnerInsurances.slice(0, 3).map((partner) => (
                    <div 
                      key={partner.id}
                      className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-4">
                        {partner.logo && (
                          <img 
                            src={partner.logo} 
                            alt={partner.name}
                            className="w-12 h-12 rounded object-contain bg-white p-1"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {partner.name}
                              </h3>
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mt-1">
                                {categories.find(c => c.value === partner.category)?.label || partner.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">{partner.rating}</span>
                            </div>
                          </div>
                          
                          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {partner.description}
                          </p>
                          
                          {partner.features && partner.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {partner.features.slice(0, 3).map((feature, idx) => (
                                <span 
                                  key={idx}
                                  className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                                >
                                  ✓ {feature}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <a
                            href={partner.affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Angebot ansehen
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {partnerInsurances.length > 3 && (
                  <button className={`w-full mt-4 py-2 text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
                    Alle Empfehlungen ansehen ({partnerInsurances.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">{t('policy_overview')}</h2>
              <div className="text-3xl font-bold">
                CHF {policies.reduce((sum, p) => {
                  const premiumMatch = p.premium?.match(/(\d+)/);
                  const premium = premiumMatch ? parseInt(premiumMatch[0]) : 0;
                  return sum + premium;
                }, 0).toLocaleString('de-CH')}
              </div>
              <div className="text-sm opacity-90">{t('annual_premium')}</div>
            </div>

            <button 
              onClick={() => setShowAddPolicy(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              {t('add_policy')}
            </button>

            {policies.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-8 text-center`}>
                <FileText className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Noch keine Policen hinzugefügt</p>
              </div>
            ) : (
              policies.map((p, i) => {
                const expiryStatus = getExpiryStatus(p.expiryDate);
                return (
                  <div key={i} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.type}</div>
                      <div className="flex items-center gap-2">
                        {p.status === 'attention' ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            {t('check_needed')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            ✓ {t('optimal')}
                          </span>
                        )}
                        
                        {/* DECKUNGEN ICON */}
                        {p.coverage && p.coverage.length > 0 && (
                          <button
                            onClick={() => setExpandedPolicies({
                              ...expandedPolicies,
                              [p.id]: !expandedPolicies[p.id]
                            })}
                            className={`p-2 rounded-lg ${expandedPolicies[p.id] ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="Deckungen anzeigen"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        
                        {p.file && (
                          <button
                            onClick={() => handleViewPDF(p)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                            title="PDF ansehen"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePolicy(p.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Löschen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{p.company}</div>
                    <div className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{p.name}</div>
                    <div className={`text-lg font-semibold mt-2 text-blue-600`}>{p.premium}</div>
                    {expiryStatus && (
                      <div className="flex items-center gap-2 mt-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${expiryStatus.bgColor} ${expiryStatus.color}`}>
                          {expiryStatus.text}
                        </span>
                      </div>
                    )}

                    {/* DECKUNGEN EXPANDABLE MIT INFO-ICONS */}
                    {expandedPolicies[p.id] && p.coverage && p.coverage.length > 0 && (
                      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Deckungen
                          </span>
                        </div>
                        <div className="space-y-2">
                          {p.coverage.map((cov, idx) => {
                            const description = getCoverageDescription(p.type, cov);
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {cov}
                                </span>
                                {description && (
                                  <div className="relative">
                                    <button
                                      onClick={() => setShowCoverageInfo(showCoverageInfo === `${p.id}-${idx}` ? null : `${p.id}-${idx}`)}
                                      className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                      title="Info anzeigen"
                                    >
                                      <Info className="w-4 h-4 text-blue-500" />
                                    </button>
                                    {showCoverageInfo === `${p.id}-${idx}` && (
                                      <div className={`absolute right-0 z-10 mt-2 w-72 p-3 rounded-lg shadow-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-start justify-between mb-2">
                                          <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {cov}
                                          </span>
                                          <button
                                            onClick={() => setShowCoverageInfo(null)}
                                            className={`p-0.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                          {description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">{t('digital_vault')}</h2>
              <div className="text-3xl font-bold">
                CHF {calculateTotalValue(valuableItems).toLocaleString('de-CH')}
              </div>
              <div className="text-sm opacity-90">{valuableItems.length} Wertgegenstände gesichert</div>
            </div>
            
            <button 
              onClick={() => setShowAddItem(true)} 
              className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Wertgegenstand hinzufügen
            </button>
            
            {valuableItems.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-8 text-center`}>
                <Camera className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Noch keine Wertgegenstände hinzugefügt</p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Dokumentieren Sie Ihre wertvollen Gegenstände mit Foto
                </p>
              </div>
            ) : (
              valuableItems.map((item) => (
                <div key={item.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                  <div className="flex gap-4">
                    <div 
                      onClick={() => handleViewImage(item)}
                      className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    >
                      <img 
                        src={item.image.data} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.name}
                          </h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.category}
                          </p>
                          {item.purchaseDate && (
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              Gekauft: {new Date(item.purchaseDate).toLocaleDateString('de-CH')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Löschen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-lg font-bold text-blue-600 mt-2">
                        CHF {parseFloat(item.value).toLocaleString('de-CH')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                  <h2 className="text-lg font-semibold">{currentUser?.email}</h2>
                  <p className="text-sm">InsuBuddy Nutzer</p>
                </div>
              </div>
            </div>
            
            {/* Benachrichtigungs-Einstellungen */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold">Benachrichtigungen</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Ablauf-Erinnerungen
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Benachrichtigungen über ablaufende Policen
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const newSettings = { ...notificationSettings, enabled: !notificationSettings.enabled };
                      setNotificationSettings(newSettings);
                      try {
                        const { saveNotificationSettings } = await import('../services/notificationService');
                        await saveNotificationSettings(currentUser.uid, newSettings);
                      } catch (error) {
                        console.error('Fehler beim Speichern:', error);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {notificationSettings.enabled && (
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Benachrichtigung {notificationSettings.reminderDays} Tage vor Ablauf
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[7, 14, 30, 60, 90].map((days) => (
                        <button
                          key={days}
                          onClick={async () => {
                            const newSettings = { ...notificationSettings, reminderDays: days };
                            setNotificationSettings(newSettings);
                            try {
                              const { saveNotificationSettings } = await import('../services/notificationService');
                              await saveNotificationSettings(currentUser.uid, newSettings);
                            } catch (error) {
                              console.error('Fehler beim Speichern:', error);
                            }
                          }}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            notificationSettings.reminderDays === days
                              ? 'bg-indigo-600 text-white'
                              : darkMode 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {days}
                        </button>
                      ))}
                    </div>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Wählen Sie, wie viele Tage vor Ablauf Sie benachrichtigt werden möchten
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin-Bereich */}
            {isAdmin && (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold">Admin-Bereich</h3>
                </div>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Partner-Versicherungen verwalten und Einstellungen anpassen
                </p>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Admin-Dashboard öffnen
                </button>
              </div>
            )}
            
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
              <button 
                onClick={() => setShowBiometricSetup(true)}
                className="w-full text-left flex items-center justify-between mb-4"
              >
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('biometric_auth')}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('biometric_desc')}</div>
                </div>
                {biometricEnabled && <Check className="w-5 h-5 text-green-500" />}
              </button>
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
              >
                Abmelden
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

      {/* ALLE MODALS BLEIBEN GLEICH - gekürzt für Speicherplatz */}
      {/* Ich füge nur das Add Policy Modal hinzu mit den Info-Icons */}

      {showAddPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('add_policy')}
              </h2>
              <button onClick={() => setShowAddPolicy(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('policy_name')}
                </label>
                <input 
                  type="text" 
                  placeholder="z.B. Hausratversicherung"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('policy_company')}
                </label>
                <input 
                  type="text" 
                  placeholder="z.B. Helvetia"
                  value={policyCompany}
                  onChange={(e) => setPolicyCompany(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('policy_type')}
                </label>
                <select 
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="">{t('select_type')}</option>
                  <option value={t('household')}>{t('household')}</option>
                  <option value={t('car')}>{t('car')}</option>
                  <option value={t('liability')}>{t('liability')}</option>
                  <option value={t('health')}>{t('health')}</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Jährliche Prämie (CHF)
                </label>
                <input 
                  type="number" 
                  placeholder="z.B. 1200"
                  value={policyPremium}
                  onChange={(e) => setPolicyPremium(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Ablaufdatum (optional)
                </label>
                <input 
                  type="date" 
                  value={policyExpiryDate}
                  onChange={(e) => setPolicyExpiryDate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* DECKUNGEN MIT INFO-ICONS - NEU */}
              {policyType && coverageTemplates[policyType] && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Was ist gedeckt? (Optional)
                  </label>
                  <div className={`border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                    {coverageTemplates[policyType].map((coverage, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={policyCoverage.includes(coverage.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPolicyCoverage([...policyCoverage, coverage.name]);
                              } else {
                                setPolicyCoverage(policyCoverage.filter(c => c !== coverage.name));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {coverage.name}
                          </span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCoverageInfo(showCoverageInfo === `add-${idx}` ? null : `add-${idx}`)}
                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                            title="Info anzeigen"
                          >
                            <Info className="w-4 h-4 text-blue-500" />
                          </button>
                          {showCoverageInfo === `add-${idx}` && (
                            <div className={`absolute right-0 z-20 mt-2 w-72 p-3 rounded-lg shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                              <div className="flex items-start justify-between mb-2">
                                <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {coverage.name}
                                </span>
                                <button
                                  onClick={() => setShowCoverageInfo(null)}
                                  className={`p-0.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {coverage.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ℹ️ Klicke auf das Info-Icon für Details zur jeweiligen Deckung
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('upload_policy_pdf')}
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Upload className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {t('select_pdf')}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {t('or_drag_drop')}
                    </p>
                    {uploadedFile && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button 
                onClick={handleSavePolicy}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Wird gespeichert...' : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          <div className="text-white mb-6 text-center">
            <h2 className="text-xl font-semibold mb-2">{t('qr_scanner')}</h2>
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

      {/* Biometric Setup Modal */}
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

      {/* Language Menu Modal */}
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

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('notifications')}</h2>
                {unreadCount > 0 && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{unreadCount} neue</p>}
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
                          <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {notif.isAuto || notif.isAdmin ? notif.title_key : t(notif.title_key)}
                          </div>
                          {notif.message && (
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                              {notif.message}
                            </div>
                          )}
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{notif.time}</div>
                        </div>
                        <div className="flex items-start gap-2">
                          {notif.isAdmin && (
                            <button
                              onClick={() => markAdminNotificationAsRead(notif.adminId)}
                              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                              title="Als gelesen markieren"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          {!notif.read && !notif.isAdmin && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Menu Modal */}
      {showExportMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl w-full max-w-md p-6 max-h-[70vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Policen PDFs exportieren</h2>
              <button onClick={() => setShowExportMenu(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {policies.filter(p => p.file).length === 0 ? (
              <div className="text-center py-8">
                <FileText className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Keine PDFs vorhanden
                </p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Laden Sie zuerst Policen-PDFs hoch
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {policies.filter(p => p.file).length} PDF{policies.filter(p => p.file).length !== 1 ? 's' : ''} verfügbar
                </p>
                {policies.filter(p => p.file).map((policy, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      // PDF herunterladen
                      const link = document.createElement('a');
                      link.href = policy.file.data;
                      link.download = policy.file.name || `${policy.type}-${policy.company}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className={`w-full text-left p-4 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} flex items-center gap-3`}
                  >
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {policy.type} - {policy.company}
                      </div>
                      <div className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {policy.file.name}
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            
            <button onClick={() => setShowExportMenu(false)} className={`w-full mt-4 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Schliessen
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Wertgegenstand hinzufügen
              </h2>
              <button onClick={() => { setShowAddItem(false); setItemImagePreview(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Name des Gegenstands *
                </label>
                <input 
                  type="text" 
                  placeholder="z.B. MacBook Pro 16"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Wert (CHF) *
                </label>
                <input 
                  type="number" 
                  placeholder="z.B. 3200"
                  value={itemValue}
                  onChange={(e) => setItemValue(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Kategorie *
                </label>
                <select 
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Kategorie wählen</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Schmuck">Schmuck</option>
                  <option value="Möbel">Möbel</option>
                  <option value="Fahrzeuge">Fahrzeuge (Velo, etc.)</option>
                  <option value="Kunstwerke">Kunstwerke</option>
                  <option value="Musikinstrumente">Musikinstrumente</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Kaufdatum (optional)
                </label>
                <input 
                  type="date" 
                  value={itemPurchaseDate}
                  onChange={(e) => setItemPurchaseDate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Foto/Quittung * (Pflichtfeld)
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {itemImagePreview ? (
                      <div>
                        <img src={itemImagePreview} alt="Vorschau" className="max-h-48 mx-auto rounded-lg mb-3" />
                        <p className="text-sm text-green-600 font-medium">✓ Bild ausgewählt</p>
                        <p className="text-xs text-gray-500 mt-1">Klicken um anderes Bild zu wählen</p>
                      </div>
                    ) : (
                      <>
                        <Camera className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          Foto aufnehmen oder auswählen
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          Klicken um Bild hochzuladen
                        </p>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-red-600 mt-2">* Ein Foto ist erforderlich um den Gegenstand zu dokumentieren</p>
              </div>

              <button 
                onClick={handleSaveItem}
                disabled={loading || !itemImage}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Wird gespeichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl">
            <div className="bg-gray-800 p-4 flex items-center justify-between rounded-t-lg">
              <div className="text-white">
                <h3 className="font-semibold">{selectedImage.name}</h3>
                <p className="text-sm text-gray-300">CHF {parseFloat(selectedImage.value).toLocaleString('de-CH')}</p>
              </div>
              <button
                onClick={() => setShowImageViewer(false)}
                className="p-2 text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-white rounded-b-lg p-4">
              <img 
                src={selectedImage.image.data} 
                alt={selectedImage.name}
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
            <div className="bg-gray-800 p-4 flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-semibold">{selectedPDF.type} - {selectedPDF.company}</h3>
                <p className="text-sm text-gray-300">{selectedPDF.file.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPDF.file.data}
                  download={selectedPDF.file.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Herunterladen
                </a>
                <button
                  onClick={() => setShowPDFViewer(false)}
                  className="p-2 text-white hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              <iframe
                src={selectedPDF.file.data}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;