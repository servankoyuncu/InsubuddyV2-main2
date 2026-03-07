import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Camera, Bell, TrendingUp, AlertCircle, CheckCircle, Upload, Plus, ChevronRight, User, Users, Moon, Sun, Globe, X, Clock, Download, QrCode, Fingerprint, Check, Shield, ExternalLink, Star, Info, Sparkles, Crown, Heart, Car, Building, Baby, Briefcase, ChevronDown, MessageSquare, Send, Loader2, Gift, Copy, FileX } from 'lucide-react';
import CancellationModal from '../components/CancellationModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { addPolicy, getUserPolicies, deletePolicy } from '../services/policyservice';
import { getNotificationSettings, checkExpiringPolicies } from '../services/notificationService';
import { addValuableItem, getUserValuableItems, deleteValuableItem, calculateTotalValue } from '../services/valuableItemsService';
import { getActiveAdminNotifications } from '../services/adminNotificationService';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../supabase';
import Onboarding from '../components/Onboarding';
import AdvisorCard from '../components/AdvisorCard';
import { checkPremiumStatus, PREMIUM_FEATURES } from '../services/premiumService';
import { useStoreKit } from '../hooks/useStoreKit';
import { checkInsuBalance, shortenAddress } from '../services/solanaService';
import { createTicket, getUserTickets } from '../services/ticketService';
import { getOrCreateReferralCode, getReferralLink, getUserReferralStats } from '../services/referralService';
import { getFeaturedAdvisor, getActiveAdvisors } from '../services/advisorService';

// Lazy Loading für schwere Komponenten
const FinancialDashboard = lazy(() => import('../components/FinancialDashboard'));
const PolicyUploader = lazy(() => import('../components/PolicyUploader'));
const PremiumModal = lazy(() => import('../components/PremiumModal'));
const PDFViewer = lazy(() => import('../components/PDFViewer'));
const PolicyChat = lazy(() => import('../components/PolicyChat'));

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

// Deckungslücken-Radar: Empfohlene Versicherungen für die Schweiz
const RECOMMENDED_INSURANCES = [
  { type: 'Krankenkasse', priority: 'pflicht', de: { label: 'Krankenkasse', description: 'Obligatorisch in der Schweiz' }, en: { label: 'Health Insurance', description: 'Mandatory in Switzerland' }, icon: Heart },
  { type: 'Haftpflicht', priority: 'sehr_empfohlen', de: { label: 'Haftpflicht', description: 'Schützt vor Schadenersatzforderungen Dritter' }, en: { label: 'Liability', description: 'Protects against third-party claims' }, icon: Shield },
  { type: 'Hausrat', priority: 'sehr_empfohlen', de: { label: 'Hausrat', description: 'Schützt dein Hab und Gut bei Schäden' }, en: { label: 'Household', description: 'Protects your belongings from damage' }, icon: Home },
  { type: 'Rechtsschutz', priority: 'empfohlen', de: { label: 'Rechtsschutz', description: 'Hilft bei rechtlichen Streitigkeiten' }, en: { label: 'Legal Protection', description: 'Helps with legal disputes' }, icon: FileText },
  { type: 'Auto', priority: 'situativ', de: { label: 'Auto', description: 'Pflicht wenn du ein Auto besitzt' }, en: { label: 'Car Insurance', description: 'Required if you own a car' }, icon: Car },
  { type: 'Gebäude', priority: 'situativ', de: { label: 'Gebäude', description: 'Wichtig für Immobilienbesitzer' }, en: { label: 'Building', description: 'Important for property owners' }, icon: Building },
  { type: 'Reise', priority: 'optional', de: { label: 'Reise', description: 'Für Vielreisende empfohlen' }, en: { label: 'Travel', description: 'Recommended for frequent travelers' }, icon: Globe },
];

// Lebensereignis-Checker: Events mit Versicherungsempfehlungen
const LIFE_EVENTS = [
  {
    id: 'umzug', labelKey: 'le_umzug', icon: Home,
    tips: {
      de: [
        { text: 'Hausratversicherung an neue Adresse anpassen', relatedType: 'Hausrat' },
        { text: 'Gebäudeversicherung prüfen (falls Eigentum)', relatedType: 'Gebäude' },
        { text: 'Haftpflichtversicherung aktualisieren', relatedType: 'Haftpflicht' },
      ],
      en: [
        { text: 'Update household insurance to new address', relatedType: 'Hausrat' },
        { text: 'Check building insurance (if you own the property)', relatedType: 'Gebäude' },
        { text: 'Update liability insurance', relatedType: 'Haftpflicht' },
      ]
    }
  },
  {
    id: 'heirat', labelKey: 'le_heirat', icon: Heart,
    tips: {
      de: [
        { text: 'Haftpflicht zusammenlegen (spart Prämie)', relatedType: 'Haftpflicht' },
        { text: 'Hausrat zusammenlegen', relatedType: 'Hausrat' },
        { text: 'Begünstigte in Lebensversicherung anpassen', relatedType: null },
        { text: 'Krankenkasse: Familienrabatte prüfen', relatedType: 'Krankenkasse' },
      ],
      en: [
        { text: 'Combine liability insurance (saves premium)', relatedType: 'Haftpflicht' },
        { text: 'Combine household insurance', relatedType: 'Hausrat' },
        { text: 'Update beneficiaries in life insurance', relatedType: null },
        { text: 'Health insurance: check family discounts', relatedType: 'Krankenkasse' },
      ]
    }
  },
  {
    id: 'kind', labelKey: 'le_kind', icon: Baby,
    tips: {
      de: [
        { text: 'Kind bei Krankenkasse anmelden', relatedType: 'Krankenkasse' },
        { text: 'Haftpflicht auf Familienpolice erweitern', relatedType: 'Haftpflicht' },
        { text: 'Lebensversicherung abschliessen / anpassen', relatedType: null },
        { text: 'Hausrat-Versicherungssumme erhöhen', relatedType: 'Hausrat' },
      ],
      en: [
        { text: 'Register child with health insurance', relatedType: 'Krankenkasse' },
        { text: 'Extend liability to family policy', relatedType: 'Haftpflicht' },
        { text: 'Take out / adjust life insurance', relatedType: null },
        { text: 'Increase household insurance sum', relatedType: 'Hausrat' },
      ]
    }
  },
  {
    id: 'auto', labelKey: 'le_auto', icon: Car,
    tips: {
      de: [
        { text: 'Autoversicherung (Haftpflicht + Kasko) abschliessen', relatedType: 'Auto' },
        { text: 'Verkehrsrechtsschutz prüfen', relatedType: 'Rechtsschutz' },
        { text: 'Pannenhilfe / Assistance einschliessen', relatedType: 'Auto' },
      ],
      en: [
        { text: 'Get car insurance (liability + comprehensive)', relatedType: 'Auto' },
        { text: 'Check traffic legal protection', relatedType: 'Rechtsschutz' },
        { text: 'Include roadside assistance', relatedType: 'Auto' },
      ]
    }
  },
  {
    id: 'hauskauf', labelKey: 'le_hauskauf', icon: Building,
    tips: {
      de: [
        { text: 'Gebäudeversicherung abschliessen (oft kantonal)', relatedType: 'Gebäude' },
        { text: 'Hausratversicherung anpassen', relatedType: 'Hausrat' },
        { text: 'Erdbebenversicherung prüfen', relatedType: null },
        { text: 'Hypothekarversicherung / Todesfallrisiko', relatedType: null },
      ],
      en: [
        { text: 'Get building insurance (often cantonal)', relatedType: 'Gebäude' },
        { text: 'Adjust household insurance', relatedType: 'Hausrat' },
        { text: 'Check earthquake insurance', relatedType: null },
        { text: 'Mortgage protection / life risk insurance', relatedType: null },
      ]
    }
  },
  {
    id: 'scheidung', labelKey: 'le_scheidung', icon: Users,
    tips: {
      de: [
        { text: 'Haftpflicht: Einzelpolice abschliessen', relatedType: 'Haftpflicht' },
        { text: 'Hausrat: Eigene Police abschliessen', relatedType: 'Hausrat' },
        { text: 'Begünstigte in allen Policen ändern', relatedType: null },
        { text: 'Krankenkasse: Prämienverbilligung prüfen', relatedType: 'Krankenkasse' },
      ],
      en: [
        { text: 'Liability: take out individual policy', relatedType: 'Haftpflicht' },
        { text: 'Household: get your own policy', relatedType: 'Hausrat' },
        { text: 'Update beneficiaries in all policies', relatedType: null },
        { text: 'Health insurance: check premium subsidies', relatedType: 'Krankenkasse' },
      ]
    }
  },
  {
    id: 'pension', labelKey: 'le_pension', icon: Clock,
    tips: {
      de: [
        { text: 'Vorsorge: 2. und 3. Säule prüfen', relatedType: null },
        { text: 'Krankenkasse: Franchise und Modell optimieren', relatedType: 'Krankenkasse' },
        { text: 'Unfallversicherung: Privat abschliessen (nicht mehr über Arbeitgeber)', relatedType: null },
        { text: 'Rechtsschutz beibehalten', relatedType: 'Rechtsschutz' },
      ],
      en: [
        { text: 'Pension: review 2nd and 3rd pillar', relatedType: null },
        { text: 'Health insurance: optimize deductible and model', relatedType: 'Krankenkasse' },
        { text: 'Accident insurance: get private coverage (no longer via employer)', relatedType: null },
        { text: 'Keep legal protection insurance', relatedType: 'Rechtsschutz' },
      ]
    }
  },
  {
    id: 'selbstaendig', labelKey: 'le_selbstaendig', icon: Briefcase,
    tips: {
      de: [
        { text: 'Unfallversicherung selbst abschliessen (UVG-Pflicht entfällt)', relatedType: null },
        { text: 'Berufshaftpflicht prüfen', relatedType: 'Haftpflicht' },
        { text: 'Krankentaggeld-Versicherung abschliessen', relatedType: null },
        { text: 'BVG: Freiwillig weiterversichern', relatedType: null },
      ],
      en: [
        { text: 'Get accident insurance yourself (employer obligation ends)', relatedType: null },
        { text: 'Check professional liability insurance', relatedType: 'Haftpflicht' },
        { text: 'Take out daily sickness allowance insurance', relatedType: null },
        { text: 'BVG: Continue voluntarily', relatedType: null },
      ]
    }
  },
];

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, language, setLanguage, currency, setCurrency, currencySymbol, CURRENCIES } = useLanguage();
  const { checkPremium: checkStoreKitPremium, isNative } = useStoreKit();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showChat, setShowChat] = useState(false);
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

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Zeige Onboarding nur wenn es noch nicht abgeschlossen wurde
    const hasCompletedOnboarding = localStorage.getItem('insubuddy_onboarding_completed');
    return !hasCompletedOnboarding;
  });

  // Onboarding abschliessen
  const handleOnboardingComplete = () => {
    localStorage.setItem('insubuddy_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  // PDF Upload State
  const [showPolicyUploader, setShowPolicyUploader] = useState(false);

  // Premium State
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', category: 'general' });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // Cancellation State
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedPolicyForCancellation, setSelectedPolicyForCancellation] = useState(null);

  // Referral State
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({ total: 0, signedUp: 0 });
  const [copied, setCopied] = useState(false);

  // Advisor State
  const [featuredAdvisor, setFeaturedAdvisor] = useState(null);
  const [advisors, setAdvisors] = useState([]);

  // Lebensereignis-Checker State
  const [selectedLifeEvent, setSelectedLifeEvent] = useState(null);

  // Handler für extrahierte Policy aus PDF
  const handlePolicyExtracted = async (policyData, file) => {
    try {
      setLoading(true);
      const newPolicy = await addPolicy(currentUser.id, policyData, file);
      setPolicies([newPolicy, ...policies]);
      setShowPolicyUploader(false);
    } catch (error) {
      console.error('Fehler beim Speichern der Police:', error);
      alert('Fehler beim Speichern der Police');
    } finally {
      setLoading(false);
    }
  };

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

  // 1. Policen laden beim Start
  useEffect(() => {
    const loadPolicies = async () => {
      if (currentUser?.id) {
        try {
          const userPolicies = await getUserPolicies(currentUser.id);
          setPolicies(userPolicies);
        } catch (error) {
          console.error('Fehler beim Laden der Policen:', error);
        }
      }
    };
    loadPolicies();
  }, [currentUser?.id]); // Fix: Nur auf ID-Änderung reagieren

  // Premium Status prüfen
  useEffect(() => {
    const loadPremiumStatus = async () => {
      if (!currentUser?.id) return;

      let premiumStatus = false;

      if (isNative) {
        // iOS: check real Apple subscription via StoreKit 2
        const result = await checkStoreKitPremium();
        premiumStatus = result.isPremium;
      } else {
        // Web: check Supabase user metadata (demo/dev flow)
        const result = await checkPremiumStatus(currentUser.id);
        premiumStatus = result.isPremium;
      }

      // Also check $INSU token balance (wallet login users get premium automatically)
      if (!premiumStatus) {
        const walletAddress = currentUser?.user_metadata?.wallet_address;
        console.log('[Dashboard] wallet_address from user_metadata:', walletAddress);
        if (walletAddress) {
          const { isPremium: tokenPremium } = await checkInsuBalance(walletAddress);
          premiumStatus = tokenPremium;
        }
      }

      setIsPremium(premiumStatus);
    };
    loadPremiumStatus();
  }, [currentUser?.id, isNative]);

  // Berater laden
  useEffect(() => {
    const loadAdvisors = async () => {
      try {
        const allAdvisors = await getActiveAdvisors();
        setAdvisors(allAdvisors);
        const featured = allAdvisors.find(a => a.featured) || null;
        setFeaturedAdvisor(featured);
      } catch (error) {
        console.error('Fehler beim Laden der Berater:', error);
      }
    };
    loadAdvisors();
  }, []);

  // 2. Partner-Versicherungen laden (UMGESTELLT AUF SUPABASE)
  useEffect(() => {
    const loadPartnerInsurances = async () => {
      try {
        const { data, error } = await supabase
          .from('partner_insurances')
          .select('*')
          .eq('status', 'published')
          .order('display_order', { ascending: true });

        if (error) throw error;
        setPartnerInsurances(data || []);
      } catch (error) {
        console.error('Fehler beim Laden der Partner:', error);
      }
    };
    
    loadPartnerInsurances();
  }, []);

  // 3. Wertgegenstände laden beim Start
  useEffect(() => {
    const loadItems = async () => {
      if (currentUser?.id) {
        try {
          const items = await getUserValuableItems(currentUser.id);
          setValuableItems(items);
        } catch (error) {
          console.error('Fehler beim Laden der Wertgegenstände:', error);
        }
      }
    };
    loadItems();
  }, [currentUser?.id]); // Fix: Nur auf ID-Änderung reagieren

  // 4. Benachrichtigungs-Einstellungen laden
  useEffect(() => {
    const loadSettings = async () => {
      if (currentUser?.id) {
        try {
          const settings = await getNotificationSettings(currentUser.id);
          if (settings) setNotificationSettings(settings);
        } catch (error) {
          console.error('Fehler beim Laden der Einstellungen:', error);
        }
      }
    };
    loadSettings();
  }, [currentUser?.id]); // Fix: Nur auf ID-Änderung reagieren

  // 5. Admin Notifications laden
  useEffect(() => {
    const loadAdminNotifications = async () => {
      try {
        const adminNotifs = await getActiveAdminNotifications();
        setAdminNotifications(adminNotifs || []);
      } catch (error) {
        console.error('Fehler bei Admin-Notifications:', error);
      }
    };
    loadAdminNotifications();
  }, []);

  // 6. Gelesene Admin Notifications aus localStorage laden
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

  // 7. Tickets laden
  const loadTickets = async () => {
    if (!currentUser?.id) return;
    const data = await getUserTickets(currentUser.id);
    setTickets(data);
  };

  useEffect(() => {
    loadTickets();
  }, [currentUser]);

  // Referral-Code laden
  useEffect(() => {
    const loadReferral = async () => {
      if (!currentUser?.id) return;
      try {
        const code = await getOrCreateReferralCode(currentUser.id);
        setReferralCode(code);
        const stats = await getUserReferralStats(currentUser.id);
        setReferralStats(stats);
      } catch (error) {
        console.error('Fehler beim Laden des Empfehlungscodes:', error);
      }
    };
    loadReferral();
  }, [currentUser]);

  const handleCopyReferral = async () => {
    const link = getReferralLink(referralCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const link = getReferralLink(referralCode);
    const text = `Hey! Ich nutze InsuBuddy um meine Versicherungen zu verwalten. Probier es auch aus - ist kostenlos!\n${link}`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleShareEmail = () => {
    const link = getReferralLink(referralCode);
    const subject = 'InsuBuddy - Versicherungen einfach verwalten';
    const body = `Hallo,\n\nich nutze InsuBuddy um meine Versicherungen zu verwalten und finde die App super praktisch. Probier es auch aus - ist kostenlos!\n\n${link}\n\nFreundliche Grüsse`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) return;
    setTicketSubmitting(true);
    try {
      await createTicket(currentUser.id, currentUser.email, ticketForm);
      setTicketForm({ subject: '', message: '', category: 'general' });
      setShowTicketModal(false);
      await loadTickets();
    } catch (error) {
      console.error('Fehler beim Erstellen des Tickets:', error);
      alert('Fehler beim Erstellen des Tickets');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = { open: 'Offen', in_progress: 'In Bearbeitung', resolved: 'Beantwortet', closed: 'Geschlossen' };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = { open: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (cat) => {
    const labels = { general: 'Allgemein', technical: 'Technisch', policy: 'Police', billing: 'Abrechnung' };
    return labels[cat] || cat;
  };

  // 8. Automatische Benachrichtigungen generieren
  useEffect(() => {
    if (notificationSettings?.enabled && policies?.length > 0) {
      const newNotifications = checkExpiringPolicies(policies, notificationSettings.reminderDays);
      setAutoNotifications(newNotifications || []);
    } else {
      setAutoNotifications([]);
    }
  }, [policies, notificationSettings]);

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
        premium: policyPremium ? `${currencySymbol} ${policyPremium}/Jahr` : `${currencySymbol} 0/Jahr`,
        expiryDate: policyExpiryDate || null,
        coverage: policyCoverage,
        status: 'ok'
      };

      // FIX: Hier muss currentUser.id stehen (nicht .uid)
      await addPolicy(currentUser.id, policyData, uploadedFile);
      
      // Policen neu laden (auch mit .id)
      const updatedPolicies = await getUserPolicies(currentUser.id);
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
      // Wenn hier immer noch RLS kommt, obwohl du .id nutzt, 
      // liegt es an der Datenbank-Policy (SQL Editor).
      alert('Fehler beim Speichern der Police: ' + (error.message || 'RLS Fehler'));
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

      // FIX: Auch hier currentUser.id nutzen
      await addValuableItem(currentUser.id, itemData, itemImage);
      
      const updatedItems = await getUserValuableItems(currentUser.id);
      setValuableItems(updatedItems);
      
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
      {/* Onboarding für neue Benutzer */}
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} darkMode={darkMode} />
      )}

      {/* Smart Import - PDF Uploader */}
      {showPolicyUploader && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>}>
          <PolicyUploader
            onPolicyExtracted={handlePolicyExtracted}
            onClose={() => setShowPolicyUploader(false)}
            darkMode={darkMode}
            coverageTemplates={coverageTemplates}
          />
        </Suspense>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <Suspense fallback={null}>
          <PremiumModal
            onClose={() => setShowPremiumModal(false)}
            darkMode={darkMode}
            userId={currentUser?.id}
            featureRequested={PREMIUM_FEATURES.AI_CHAT}
            onPremiumActivated={() => {
              setIsPremium(true);
              setShowPremiumModal(false);
              setShowChat(true);
            }}
          />
        </Suspense>
      )}

      {/* Kündigungsassistent Modal */}
      {showCancellationModal && selectedPolicyForCancellation && (
        <CancellationModal
          policy={selectedPolicyForCancellation}
          userEmail={currentUser?.email}
          onClose={() => {
            setShowCancellationModal(false);
            setSelectedPolicyForCancellation(null);
          }}
          darkMode={darkMode}
        />
      )}

      {/* Top Navigation — fixed full width */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl" style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f' }}>
        <div className="flex items-center justify-between px-4 pt-safe pb-3 pt-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 pl-1">
            <img src="/icons/appstore.png" alt="InsuBuddy" className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-semibold text-white">{t('app_title')}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowExportMenu(true)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setShowLanguageMenu(true)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCurrencyMenu(true)} className="px-2 py-1 rounded-full text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              {currency}
            </button>
            <button onClick={() => setShowNotifications(true)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('profile')} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${activeTab === 'profile' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pt-24 pb-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-3 gap-4">
              <div className={`${darkMode ? 'bg-blue-900/80' : 'bg-blue-50/80'} backdrop-blur-xl p-4 rounded-2xl shadow-lg shadow-blue-500/10 transition-all duration-300`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{policies.length}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('active_policies')}</div>
              </div>
              <div className={`${darkMode ? 'bg-green-900/80' : 'bg-green-50/80'} backdrop-blur-xl p-4 rounded-2xl shadow-lg shadow-green-500/10 transition-all duration-300`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  {policies.filter(p => p.file).length}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('with_pdf')}</div>
              </div>
              <div className={`${darkMode ? 'bg-orange-900/80' : 'bg-orange-50/80'} backdrop-blur-xl p-4 rounded-2xl shadow-lg shadow-orange-500/10 transition-all duration-300`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                  {policies.filter(p => getDaysUntilExpiry(p.expiryDate) <= 30 && getDaysUntilExpiry(p.expiryDate) >= 0).length}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('expiring_soon')}</div>
              </div>
            </div>

            {policies.filter(p => getDaysUntilExpiry(p.expiryDate) <= 30 && getDaysUntilExpiry(p.expiryDate) >= 0).length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border transition-all duration-300`}>
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('expiring_policies')}</h2>
                </div>
                {policies.filter(p => getDaysUntilExpiry(p.expiryDate) <= 30 && getDaysUntilExpiry(p.expiryDate) >= 0).map((policy, i) => (
                  <div key={i} className={`p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{policy.type} - {policy.company}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t('expires_in_days')} {getDaysUntilExpiry(policy.expiryDate)} {t('days_suffix')}
                        </div>
                        <div className="text-sm text-blue-600 mt-2">{t('renew_now')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats Kachel */}
            {policies.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-6 transition-all duration-300`}>
                <h2 className={`font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 {t('your_insurances')} {new Date().getFullYear()}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('annual_costs')}</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currencySymbol} {calculateTotalAnnualPremium().toLocaleString('de-CH')}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('per_month')}</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currencySymbol} {Math.round(calculateTotalAnnualPremium() / 12).toLocaleString('de-CH')}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('active_policies_label')}</div>
                    <div className={`text-2xl font-bold text-blue-600`}>{policies.length}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('documented')}</div>
                    <div className={`text-2xl font-bold text-green-600`}>
                      {policies.filter(p => p.file).length}/{policies.length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prämien-Vergleich mit Balken */}
            {getPremiumBreakdown().length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-6 transition-all duration-300`}>
                <h2 className={`font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('monthly_premium_overview')}
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
                            {currencySymbol} {item.monthly}
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
                  {t('total_per_month')}: <span className="font-bold">{currencySymbol} {getPremiumBreakdown().reduce((sum, p) => sum + p.monthly, 0).toLocaleString('de-CH')}</span>
                </div>
              </div>
            )}

            {/* Deckungslücken-Radar */}
            {(() => {
              const userTypes = policies.map(p => p.type);
              const covered = RECOMMENDED_INSURANCES.filter(ins =>
                userTypes.some(t => t && t.toLowerCase().includes(ins.type.toLowerCase()))
              );
              const missing = RECOMMENDED_INSURANCES.filter(ins =>
                !userTypes.some(t => t && t.toLowerCase().includes(ins.type.toLowerCase()))
              );
              const total = RECOMMENDED_INSURANCES.length;
              const coveredCount = covered.length;
              const percentage = Math.round((coveredCount / total) * 100);

              const priorityColor = (priority) => {
                const colors = {
                  pflicht: { bg: darkMode ? 'bg-red-900/40' : 'bg-red-50', text: darkMode ? 'text-red-300' : 'text-red-700', badge: darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700' },
                  sehr_empfohlen: { bg: darkMode ? 'bg-orange-900/40' : 'bg-orange-50', text: darkMode ? 'text-orange-300' : 'text-orange-700', badge: darkMode ? 'bg-orange-800 text-orange-200' : 'bg-orange-100 text-orange-700' },
                  empfohlen: { bg: darkMode ? 'bg-yellow-900/40' : 'bg-yellow-50', text: darkMode ? 'text-yellow-300' : 'text-yellow-700', badge: darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-700' },
                  situativ: { bg: darkMode ? 'bg-blue-900/40' : 'bg-blue-50', text: darkMode ? 'text-blue-300' : 'text-blue-700', badge: darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700' },
                  optional: { bg: darkMode ? 'bg-gray-700/40' : 'bg-gray-50', text: darkMode ? 'text-gray-300' : 'text-gray-600', badge: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600' },
                };
                return colors[priority] || colors.optional;
              };

              return (
                <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-6 transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <Shield className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('coverage_radar')}
                      </h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('coverage_radar_sub')}
                      </p>
                    </div>
                  </div>

                  {/* Fortschrittsbalken */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {coveredCount} {t('of')} {total} {t('covered_label')}
                      </span>
                      <span className={`text-sm font-bold ${percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {missing.length === 0 ? (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{t('well_covered')}</p>
                        <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{t('well_covered_sub')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {missing.map(ins => {
                        const colors = priorityColor(ins.priority);
                        const IconComp = ins.icon;
                        return (
                          <div key={ins.type} className={`p-3 rounded-xl flex items-center gap-3 ${colors.bg}`}>
                            <IconComp className={`w-5 h-5 ${colors.text}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ins[language].label}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>{t(`priority_${ins.priority}`)}</span>
                              </div>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ins[language].description}</p>
                            </div>
                            <AlertCircle className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Vorhandene als kleine Chips */}
                  {covered.length > 0 && missing.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed" style={{ borderColor: darkMode ? '#374151' : '#E5E7EB' }}>
                      <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('covered_tag')}</p>
                      <div className="flex flex-wrap gap-2">
                        {covered.map(ins => (
                          <span key={ins.type} className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
                            <CheckCircle className="w-3 h-3" />
                            {ins[language].label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Lebensereignis-Checker */}
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-6 transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                  <Sparkles className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('life_event_checker')}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('life_event_sub')}
                  </p>
                </div>
              </div>

              {/* Event Grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {LIFE_EVENTS.map(event => {
                  const IconComp = event.icon;
                  const isSelected = selectedLifeEvent === event.id;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedLifeEvent(isSelected ? null : event.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-center ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      <span className="text-[10px] font-medium leading-tight">{t(event.labelKey)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Event Details */}
              {selectedLifeEvent && (() => {
                const event = LIFE_EVENTS.find(e => e.id === selectedLifeEvent);
                if (!event) return null;
                const userTypes = policies.map(p => p.type);

                return (
                  <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
                    <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <event.icon className="w-5 h-5 text-purple-500" />
                      {t('checklist')}: {t(event.labelKey)}
                    </h3>
                    <div className="space-y-2.5">
                      {event.tips[language].map((tip, idx) => {
                        const hasCoverage = tip.relatedType && userTypes.some(t => t && t.toLowerCase().includes(tip.relatedType.toLowerCase()));
                        return (
                          <div key={idx} className="flex items-start gap-3">
                            {hasCoverage ? (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tip.relatedType ? 'text-red-500' : 'text-orange-400'}`} />
                            )}
                            <div>
                              <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{tip.text}</p>
                              {hasCoverage && (
                                <p className="text-xs text-green-500 mt-0.5">{t('already_covered')}</p>
                              )}
                              {!hasCoverage && tip.relatedType && (
                                <p className="text-xs text-red-400 mt-0.5">{t('not_yet')}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setActiveTab('advisors')}
                      className="mt-4 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      {t('contact_advisor')}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Empfohlene Versicherungen */}
            {partnerInsurances.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-6 transition-all duration-300`}>
                <h2 className={`font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('recommended_insurances')}
                </h2>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('partner_offers')}
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
                            {t('view_offer')}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {partnerInsurances.length > 3 && (
                  <button className={`w-full mt-4 py-2 text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
                    {t('view_all')} ({partnerInsurances.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-500/30">
              <h2 className="text-xl font-semibold mb-2">{t('policy_overview')}</h2>
              <div className="text-3xl font-bold">
                {currencySymbol} {policies.reduce((sum, p) => {
                  const premiumMatch = p.premium?.match(/(\d+)/);
                  const premium = premiumMatch ? parseInt(premiumMatch[0]) : 0;
                  return sum + premium;
                }, 0).toLocaleString('de-CH')}
              </div>
              <div className="text-sm opacity-90">{t('annual_premium')}</div>
            </div>

            {/* Smart Import Button - Premium Feature */}
            <button
              onClick={() => setShowPolicyUploader(true)}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-3 relative ${
                darkMode
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
              } text-white`}
            >
              <Sparkles className="w-5 h-5" />
              Smart Import (PDF)
              {/* PRO Badge deaktiviert - Premium temporär ausgesetzt
              {!isPremium && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  PRO
                </span>
              )}
              */}
            </button>

            <button
              onClick={() => setShowAddPolicy(true)}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Plus className="w-5 h-5" />
              {t('add_policy')}
            </button>

            {policies.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-8 text-center`}>
                <FileText className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('no_policies')}</p>
              </div>
            ) : (
              policies.map((p, i) => {
                const expiryStatus = getExpiryStatus(p.expiryDate);
                return (
                  <div key={i} className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-4`}>
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
                          onClick={() => {
                            setSelectedPolicyForCancellation(p);
                            setShowCancellationModal(true);
                          }}
                          className={`p-2 rounded-lg ${darkMode ? 'text-orange-400 hover:bg-orange-900/20' : 'text-orange-500 hover:bg-orange-50'}`}
                          title="Kündigen"
                        >
                          <FileX className="w-4 h-4" />
                        </button>
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
                            {t('coverages_label')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {p.coverage.map((cov, idx) => {
                            const description = getCoverageDescription(p.type, cov);
                            const infoKey = `${p.id}-${idx}`;
                            const isOpen = showCoverageInfo === infoKey;
                            return (
                              <div key={idx}>
                                <div className="flex items-start gap-2 py-1">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className={`text-sm flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {cov}
                                  </span>
                                  {description && (
                                    <button
                                      onClick={() => setShowCoverageInfo(isOpen ? null : infoKey)}
                                      className={`p-1 rounded-full flex-shrink-0 transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-500 hover:bg-blue-50'}`}
                                      title="Info anzeigen"
                                    >
                                      <Info className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                {isOpen && description && (
                                  <div className={`ml-6 mb-1 px-3 py-2 rounded-xl text-xs ${darkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
                                    {description}
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
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white p-6 rounded-2xl shadow-xl shadow-purple-500/30">
              <h2 className="text-xl font-semibold mb-2">{t('digital_vault')}</h2>
              <div className="text-3xl font-bold">
                {currencySymbol} {calculateTotalValue(valuableItems).toLocaleString('de-CH')}
              </div>
              <div className="text-sm opacity-90">{valuableItems.length} {t('secured_items')}</div>
            </div>
            
            <button 
              onClick={() => setShowAddItem(true)} 
              className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              {t('add_item')}
            </button>

            {valuableItems.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-8 text-center`}>
                <Camera className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('no_items')}</p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {t('no_items_sub')}
                </p>
              </div>
            ) : (
              valuableItems.map((item) => (
                <div key={item.id} className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-4`}>
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
                              {t('item_purchased')} {new Date(item.purchaseDate).toLocaleDateString('de-CH')}
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
                        {currencySymbol} {parseFloat(item.value).toLocaleString('de-CH')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'finances' && (
          <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
            <FinancialDashboard
              policies={policies}
              darkMode={darkMode}
              language={language}
              currentUser={currentUser}
              currencySymbol={currencySymbol}
            />
          </Suspense>
        )}

        {activeTab === 'advisors' && (
          <div className="space-y-4 animate-fadeIn">
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-6 transition-all duration-300`}>
              <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('advisors_title')}
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('advisors_sub')}
              </p>
            </div>

            {advisors.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className="font-medium text-lg mb-2">{t('no_advisors')}</p>
                <p className="text-sm">{t('no_advisors_sub')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {advisors.map(advisor => (
                  <AdvisorCard
                    key={advisor.id}
                    advisor={advisor}
                    darkMode={darkMode}
                    collapsible={true}
                    userId={currentUser?.id}
                    policies={policies}
                    onReviewAdded={() => {
                      getActiveAdvisors().then(setAdvisors);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white p-6 rounded-2xl shadow-xl shadow-indigo-500/30">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{currentUser?.email}</h2>
                  <p className="text-sm">{t('profile_user')}</p>
                  {currentUser?.user_metadata?.wallet_address && (
                    <p className="text-xs mt-1 opacity-70 font-mono">
                      🔗 {shortenAddress(currentUser.user_metadata.wallet_address)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Benachrichtigungs-Einstellungen */}
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-4`}>
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold">{t('notifications')}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('expiry_reminders')}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('expiry_reminders_sub')}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const newSettings = { ...notificationSettings, enabled: !notificationSettings.enabled };
                      setNotificationSettings(newSettings);
                      try {
                        const { saveNotificationSettings } = await import('../services/notificationService');
                        await saveNotificationSettings(currentUser.id, newSettings);
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
                      {t('notify_before')} {notificationSettings.reminderDays} {t('days_before_expiry')}
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
                              await saveNotificationSettings(currentUser.id, newSettings);
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

            {/* Support-Tickets */}
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-cyan-600" />
                  <h3 className="text-lg font-semibold">Support</h3>

                </div>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('new_ticket')}
                </button>
              </div>

              {tickets.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Noch keine Tickets erstellt. Bei Fragen oder Problemen können Sie hier ein Ticket eröffnen.
                </p>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {ticket.subject}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {getCategoryLabel(ticket.category)}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(ticket.created_at).toLocaleDateString('de-CH')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {ticket.message}
                      </p>
                      {ticket.admin_reply && (
                        <div className={`mt-3 p-3 rounded-lg border-l-4 border-green-500 ${darkMode ? 'bg-gray-600' : 'bg-green-50'}`}>
                          <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                            {t('support_reply')}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {ticket.admin_reply}
                          </p>
                          {ticket.replied_at && (
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(ticket.replied_at).toLocaleDateString('de-CH')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Freunde einladen */}
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border overflow-hidden`}>
              <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-emerald-600 p-4 text-white shadow-lg shadow-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('invite_friends')}</h3>
                    <p className="text-sm text-green-100">{t('invite_friends_sub')}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Referral Link + Copy */}
                <div className={`flex items-center gap-2 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('personal_link')}</p>
                    <p className={`text-sm font-mono truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {referralCode ? getReferralLink(referralCode) : 'Wird geladen...'}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    disabled={!referralCode}
                    className={`flex-shrink-0 p-2.5 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Share Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    disabled={!referralCode}
                    className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleShareEmail}
                    disabled={!referralCode}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    E-Mail
                  </button>
                </div>

                {/* Stats */}
                {referralStats.total > 0 && (
                  <div className={`flex items-center gap-4 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-1.5">
                      <Users className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {referralStats.total} eingeladen
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {referralStats.signedUp} registriert
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin-Bereich */}
            {isAdmin && (
              <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-4`}>
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
            
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border p-4`}>
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
                onClick={() => navigate('/account-settings')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 mb-3 flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" />
                {t('account_settings_btn')}
              </button>
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KI-Chat Floating Button */}
      <button
        onClick={() => {
          if (policies.length === 0) {
            alert('Bitte lade zuerst eine Police hoch, bevor du den KI-Assistenten verwendest.');
            return;
          }
          isPremium ? setShowChat(true) : setShowPremiumModal(true);
        }}
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform ${policies.length === 0 ? 'opacity-40' : ''}`}
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {!isPremium && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
            <Crown className="w-3 h-3 text-white" />
          </span>
        )}
      </button>

      {/* KI-Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className={`w-full rounded-t-3xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`} style={{ height: '90vh' }}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('chat_title')}</h2>
                  <p className={`text-xs ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Powered by Claude AI</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4">
              <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
                <PolicyChat darkMode={darkMode} policies={policies} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation — pill style */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideInFromBottom">
        <div className="flex items-center gap-1 px-3 py-3 rounded-full shadow-2xl border backdrop-blur-xl" style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f', boxShadow: '0 8px 32px rgba(10, 22, 40, 0.6)' }}>
          {[
            { id: 'dashboard', icon: <Home className="w-5 h-5" /> },
            { id: 'policies', icon: <FileText className="w-5 h-5" /> },
            { id: 'vault', icon: <Camera className="w-5 h-5" /> },
            { id: 'finances', icon: <TrendingUp className="w-5 h-5" /> },
            { id: 'advisors', icon: <Users className="w-5 h-5" /> },
          ].map(({ id, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white/15 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {icon}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-11 h-11 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-300 transition-all duration-200"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ALLE MODALS BLEIBEN GLEICH - gekürzt für Speicherplatz */}
      {/* Ich füge nur das Add Policy Modal hinzu mit den Info-Icons */}

      {showAddPolicy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
                  {t('annual_premium_field')} ({currencySymbol})
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
                  {t('expiry_date_field')}
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
                    {t('what_covered')}
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
                {loading ? t('saving') : t('save')}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl w-full max-w-sm pb-4`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('language')}</h2>
            </div>
            <div className="px-4 pt-3 space-y-1">
              {languages.map(lang => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/20'
                        : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl leading-none w-8">{lang.flag}</span>
                    <span className={`flex-1 text-left font-semibold text-sm ${isSelected ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {lang.name}
                    </span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-4 mt-4">
              <button
                onClick={() => setShowLanguageMenu(false)}
                className={`w-full py-3 rounded-2xl text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Menu Modal */}
      {showCurrencyMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl w-full max-w-sm pb-4`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('currency')}</h2>
            </div>
            {/* Currency list */}
            <div className="px-4 pt-3 space-y-1">
              {CURRENCIES.map(cur => {
                const isSelected = currency === cur.code;
                return (
                  <button
                    key={cur.code}
                    onClick={() => { setCurrency(cur.code); setShowCurrencyMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/20'
                        : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl leading-none w-8">{cur.flag}</span>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold text-sm ${isSelected ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {cur.code}
                      </div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {cur.name}
                      </div>
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${isSelected ? 'text-white' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {cur.symbol}
                    </span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-4 mt-4">
              <button
                onClick={() => setShowCurrencyMenu(false)}
                className={`w-full py-3 rounded-2xl text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl`}>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center p-0 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl w-full max-w-md p-6 max-h-[70vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('export_modal_title')}</h2>
              <button onClick={() => setShowExportMenu(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {policies.filter(p => p.file).length === 0 ? (
              <div className="text-center py-8">
                <FileText className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('no_pdfs')}
                </p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {t('no_pdfs_sub')}
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
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('add_item_title')}
              </h2>
              <button onClick={() => { setShowAddItem(false); setItemImagePreview(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('item_name_label')} *
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
                  {t('item_value_label')} ({currencySymbol}) *
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
                  {t('item_category_label')} *
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
                  {t('item_purchase_date_label')}
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
                  {t('item_photo_label')} *
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
                {loading ? t('saving') : t('save')}
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
                <p className="text-sm text-gray-300">{currencySymbol} {parseFloat(selectedImage.value).toLocaleString('de-CH')}</p>
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
                  {t('download')}
                </a>
                <button
                  onClick={() => setShowPDFViewer(false)}
                  className="p-2 text-white hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>}>
              <PDFViewer pdfData={selectedPDF.file.data} />
            </Suspense>
          </div>
        </div>
      )}
      {/* Ticket erstellen Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl`}>
            <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('new_ticket')}
                </h2>
                <button onClick={() => setShowTicketModal(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleTicketSubmit} className="p-5 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kategorie</label>
                <select
                  value={ticketForm.category}
                  onChange={e => setTicketForm({...ticketForm, category: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="general">Allgemein</option>
                  <option value="technical">Technisches Problem</option>
                  <option value="policy">Police / Versicherung</option>
                  <option value="billing">Abrechnung</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Betreff</label>
                <input
                  value={ticketForm.subject}
                  onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
                  placeholder="Worum geht es?"
                  required
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nachricht</label>
                <textarea
                  value={ticketForm.message}
                  onChange={e => setTicketForm({...ticketForm, message: e.target.value})}
                  placeholder="Beschreiben Sie Ihr Anliegen..."
                  rows={4}
                  required
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
                />
              </div>
              <button
                type="submit"
                disabled={ticketSubmitting || !ticketForm.subject || !ticketForm.message}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {ticketSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {t('ticket_submit_btn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;