import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Tesseract from 'tesseract.js';

export default function PolicyScanner({ onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  async function takePicture() {
    try {
      setScanning(true);
      
      // Foto aufnehmen
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      // OCR durchführen
      const result = await Tesseract.recognize(
        image.dataUrl,
        'deu', // Deutsch
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      
      // Text extrahieren
      const extractedText = result.data.text;
      
      // Informationen parsen
      const parsed = parseInsuranceDocument(extractedText);
      
      // An Parent-Component zurückgeben
      onScanComplete(parsed);
      
    } catch (error) {
      console.error('Scanner-Fehler:', error);
      alert('Scan fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setScanning(false);
      setProgress(0);
    }
  }

  function parseInsuranceDocument(text) {
    // Vereinfachte Parsing-Logik
    const result = {
      name: '',
      number: '',
      expiryDate: '',
      amount: ''
    };
    
    // Versicherungsnummer finden (Patterns)
    const policyNumberMatch = text.match(/(?:Vertragsnummer|Police|Versicherungsnummer)[:\s]+([A-Z0-9-]+)/i);
    if (policyNumberMatch) {
      result.number = policyNumberMatch[1];
    }
    
    // Datum finden (DD.MM.YYYY)
    const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
    if (dateMatch) {
      result.expiryDate = dateMatch[1];
    }
    
    // Betrag finden
    const amountMatch = text.match(/(\d+[,\.]\d{2})\s*€/);
    if (amountMatch) {
      result.amount = amountMatch[1].replace(',', '.');
    }
    
    // Versicherungstyp erraten
    const types = ['haftpflicht', 'hausrat', 'kfz', 'rechtsschutz', 'leben'];
    for (const type of types) {
      if (text.toLowerCase().includes(type)) {
        result.name = type.charAt(0).toUpperCase() + type.slice(1);
        break;
      }
    }
    
    return result;
  }

  return (
    <div className="policy-scanner">
      <button
        onClick={takePicture}
        disabled={scanning}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {scanning ? `Scannt... ${progress}%` : '📸 Police scannen'}
      </button>
      
      {scanning && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Dokument wird analysiert...
          </p>
        </div>
      )}
    </div>
  );
}