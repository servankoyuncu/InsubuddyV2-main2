/**
 * PDF Extraction Service
 * Extrahiert automatisch Policen-Daten aus hochgeladenen PDF-Dokumenten
 */

import * as pdfjsLib from 'pdfjs-dist';

// PDF.js Worker konfigurieren für Version 5.x
// Verwende unpkg CDN - hat immer alle npm Versionen
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';

/**
 * Extrahiert Text aus einer PDF-Datei
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // PDF laden
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer
    });

    const pdf = await loadingTask.promise;

    let fullText = '';

    // Alle Seiten durchgehen
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    console.log('PDF Text extrahiert:', fullText.substring(0, 500)); // Debug
    return fullText;
  } catch (error) {
    console.error('Fehler beim Extrahieren des PDF-Texts:', error);
    throw error;
  }
};

/**
 * Bekannte Schweizer Versicherungsunternehmen
 */
const KNOWN_COMPANIES = [
  // Krankenkassen
  'CSS', 'Swica', 'Helsana', 'Sanitas', 'Concordia', 'Visana', 'KPT', 'Groupe Mutuel',
  'Assura', 'Atupri', 'ÖKK', 'EGK', 'Sympany', 'SLKK', 'Sana24', 'Aquilana',
  // Sachversicherungen
  'Mobiliar', 'AXA', 'Zurich', 'Allianz', 'Helvetia', 'Baloise', 'Generali',
  'Vaudoise', 'Swiss Life', 'Die Mobiliar', 'La Mobilière',
  // Weitere
  'TCS', 'Smile', 'Dextra', 'Elvia', 'ERV', 'Touring Club Schweiz'
];

/**
 * Versicherungstypen und ihre Keywords
 */
const INSURANCE_TYPES = {
  'Krankenkasse': ['krankenkasse', 'grundversicherung', 'krankenversicherung', 'kvg', 'prämie', 'franchise', 'obligatorische'],
  'Hausrat': ['hausrat', 'hausratversicherung', 'mobiliar', 'einbruch', 'diebstahl', 'feuer', 'wasser'],
  'Haftpflicht': ['haftpflicht', 'privathaftpflicht', 'haftpflichtversicherung', 'personenschaden', 'sachschaden'],
  'Auto': ['auto', 'fahrzeug', 'motorfahrzeug', 'kfz', 'kasko', 'vollkasko', 'teilkasko', 'haftpflicht'],
  'Gebäude': ['gebäude', 'gebäudeversicherung', 'immobilie', 'haus', 'wohngebäude'],
  'Rechtsschutz': ['rechtsschutz', 'rechtsschutzversicherung', 'anwalt', 'prozess'],
  'Reise': ['reise', 'reiseversicherung', 'annullierung', 'gepäck', 'ausland'],
  'Leben': ['leben', 'lebensversicherung', 'todesfallkapital', 'risikoversicherung', 'säule 3a', 'säule 3b']
};

/**
 * Extrahiert Policen-Daten aus dem PDF-Text
 */
export const extractPolicyData = (text) => {
  const normalizedText = text.toLowerCase();
  const originalText = text;

  const result = {
    name: null,
    company: null,
    type: null,
    premium: null,
    premiumPeriod: 'Jahr',
    expiryDate: null,
    policyNumber: null,
    confidence: 0
  };

  // 1. Versicherungsunternehmen finden
  for (const company of KNOWN_COMPANIES) {
    if (normalizedText.includes(company.toLowerCase())) {
      result.company = company;
      result.confidence += 20;
      break;
    }
  }

  // 2. Versicherungstyp erkennen
  let maxScore = 0;
  for (const [type, keywords] of Object.entries(INSURANCE_TYPES)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      result.type = type;
    }
  }
  if (result.type) {
    result.confidence += 20;
  }

  // 3. Prämie/Betrag finden (CHF)
  const premiumPatterns = [
    /(?:prämie|premium|betrag|total|monatlich|jährlich)[:\s]*(?:chf|fr\.?|sfr\.?)\s*([\d'.,]+)/gi,
    /(?:chf|fr\.?|sfr\.?)\s*([\d'.,]+)(?:\s*(?:pro|per|\/)\s*(?:monat|jahr|year|month))?/gi,
    /([\d'.,]+)\s*(?:chf|fr\.?|sfr\.?)/gi
  ];

  for (const pattern of premiumPatterns) {
    const matches = [...originalText.matchAll(pattern)];
    if (matches.length > 0) {
      // Finde den grössten Betrag (wahrscheinlich Jahresprämie)
      let maxAmount = 0;
      for (const match of matches) {
        const amountStr = match[1].replace(/[']/g, '').replace(',', '.');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > maxAmount && amount < 100000) {
          maxAmount = amount;
        }
      }
      if (maxAmount > 0) {
        result.premium = maxAmount;
        result.confidence += 20;

        // Prüfen ob monatlich oder jährlich
        const contextMatch = originalText.match(new RegExp(`${maxAmount}[^.]*?(monat|month|jahr|year|annual)`, 'i'));
        if (contextMatch) {
          if (contextMatch[1].toLowerCase().includes('monat') || contextMatch[1].toLowerCase().includes('month')) {
            result.premiumPeriod = 'Monat';
          }
        }
        break;
      }
    }
  }

  // 4. Ablaufdatum finden
  const datePatterns = [
    /(?:ablauf|gültig bis|ende|expiry|valid until|bis)[:\s]*(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/gi,
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/g
  ];

  for (const pattern of datePatterns) {
    const match = pattern.exec(originalText);
    if (match) {
      let day = parseInt(match[1]);
      let month = parseInt(match[2]);
      let year = parseInt(match[3]);

      // Jahr korrigieren wenn nur 2-stellig
      if (year < 100) {
        year += 2000;
      }

      // Validieren
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024 && year <= 2100) {
        result.expiryDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        result.confidence += 20;
        break;
      }
    }
  }

  // 5. Policennummer finden
  const policyNumberPatterns = [
    /(?:police|policen?-?nr\.?|vertrag|vertrags?-?nr\.?|policy)[:\s#]*([A-Z0-9\-\.]{5,20})/gi,
    /(?:nr\.?|nummer)[:\s]*([A-Z0-9\-\.]{6,20})/gi
  ];

  for (const pattern of policyNumberPatterns) {
    const match = pattern.exec(originalText);
    if (match) {
      result.policyNumber = match[1].trim();
      result.confidence += 10;
      break;
    }
  }

  // 6. Namen generieren
  if (result.type && result.company) {
    result.name = `${result.type} - ${result.company}`;
    result.confidence += 10;
  } else if (result.type) {
    result.name = result.type;
  } else if (result.company) {
    result.name = `Versicherung - ${result.company}`;
  }

  return result;
};

/**
 * Hauptfunktion: PDF verarbeiten und Daten extrahieren
 */
export const processPolicyPDF = async (file) => {
  try {
    // 1. Text aus PDF extrahieren
    const text = await extractTextFromPDF(file);

    // 2. Policen-Daten extrahieren
    const policyData = extractPolicyData(text);

    return {
      success: true,
      data: policyData,
      rawText: text // Vollständiger Text für KI-Chat
    };
  } catch (error) {
    console.error('Fehler beim Verarbeiten der PDF:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Formatiert die Prämie für die Anzeige
 */
export const formatPremium = (amount, period = 'Jahr') => {
  if (!amount) return '';
  return `CHF ${amount.toLocaleString('de-CH')}/${period}`;
};
