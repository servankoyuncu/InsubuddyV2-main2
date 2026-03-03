import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Loader2, Sparkles, Edit3 } from 'lucide-react';
import { processPolicyPDF, formatPremium } from '../services/pdfExtractionService';

const PolicyUploader = ({
  onPolicyExtracted,
  onClose,
  darkMode = false,
  coverageTemplates = {}
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [extractedRawText, setExtractedRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Editierbare Felder
  const [editedData, setEditedData] = useState({
    name: '',
    company: '',
    type: '',
    premium: '',
    expiryDate: '',
    policyNumber: ''
  });

  const fileInputRef = useRef(null);

  const insuranceTypes = [
    'Hausrat', 'Haftpflicht', 'Auto', 'Krankenkasse',
    'Gebäude', 'Rechtsschutz', 'Reise', 'Leben'
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      await processFile(file);
    } else {
      setError('Bitte nur PDF-Dateien hochladen');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setError(null);
    setSelectedFile(file);

    try {
      const result = await processPolicyPDF(file);
      console.log('PDF Extraction Result:', result); // Debug

      if (result.success && result.data) {
        // Auch bei niedrigem Confidence weiter machen, aber Edit-Mode aktivieren
        setExtractedData(result.data);
        setExtractedRawText(result.rawText || '');
        setEditedData({
          name: result.data.name || '',
          company: result.data.company || '',
          type: result.data.type || '',
          premium: result.data.premium ? String(result.data.premium) : '',
          expiryDate: result.data.expiryDate || '',
          policyNumber: result.data.policyNumber || ''
        });

        // Bei niedrigem Confidence automatisch Edit-Mode aktivieren
        if (result.data.confidence < 30) {
          setEditMode(true);
          setError('Wenige Daten erkannt. Bitte überprüfen und ergänzen.');
        }
      } else {
        // Fehler bei der Extraktion - trotzdem manuelles Ausfüllen ermöglichen
        console.error('Extraction failed:', result.error);
        setExtractedData({ confidence: 0 }); // Leeres Objekt für UI
        setEditedData({
          name: '',
          company: '',
          type: '',
          premium: '',
          expiryDate: '',
          policyNumber: ''
        });
        setEditMode(true);
        setError(result.error
          ? `Fehler: ${result.error}. Bitte manuell ausfüllen.`
          : 'Konnte keine Daten extrahieren. Bitte manuell ausfüllen.');
      }
    } catch (err) {
      console.error('Fehler:', err);
      // Bei Fehler trotzdem manuelles Ausfüllen ermöglichen
      setExtractedData({ confidence: 0 });
      setEditedData({
        name: '',
        company: '',
        type: '',
        premium: '',
        expiryDate: '',
        policyNumber: ''
      });
      setEditMode(true);
      setError('PDF konnte nicht gelesen werden. Bitte manuell ausfüllen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    const premiumValue = parseFloat(editedData.premium) || 0;
    const formattedPremium = premiumValue > 0
      ? `CHF ${premiumValue}/Jahr`
      : '';

    const policyData = {
      name: editedData.name || `${editedData.type} - ${editedData.company}`,
      company: editedData.company,
      type: editedData.type,
      premium: formattedPremium,
      expiryDate: editedData.expiryDate,
      coverage: coverageTemplates[editedData.type]
        ? coverageTemplates[editedData.type].map(c => c.name)
        : [],
      extractedText: extractedRawText
    };

    onPolicyExtracted(policyData, selectedFile);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-500';
    if (confidence >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 70) return 'Hohe Erkennungsrate';
    if (confidence >= 40) return 'Mittlere Erkennungsrate';
    return 'Niedrige Erkennungsrate - Bitte prüfen';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Smart Import
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                PDF hochladen & automatisch ausfüllen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Upload Area */}
          {!extractedData && !isProcessing && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : darkMode
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDragging ? 'bg-blue-500' : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-blue-500'}`} />
                </div>

                <div>
                  <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    PDF hier ablegen
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    oder klicken zum Auswählen
                  </p>
                </div>

                <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <FileText className="w-4 h-4" />
                  <span>Nur PDF-Dateien</span>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                PDF wird analysiert...
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Texterkennung & Datenextraktion
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Extracted Data Preview */}
          {extractedData && !isProcessing && (
            <div className="space-y-4">
              {/* Confidence Indicator */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <Check className={`w-5 h-5 ${getConfidenceColor(extractedData.confidence)}`} />
                  <span className={`text-sm font-medium ${getConfidenceColor(extractedData.confidence)}`}>
                    {getConfidenceText(extractedData.confidence)}
                  </span>
                </div>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  {editMode ? 'Vorschau' : 'Bearbeiten'}
                </button>
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <FileText className="w-5 h-5 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedFile.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Wird mit Police gespeichert
                    </p>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )}

              {/* Data Fields */}
              <div className="space-y-3">
                {/* Versicherungstyp */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Versicherungstyp *
                  </label>
                  {editMode ? (
                    <select
                      value={editedData.type}
                      onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                      className={`w-full p-2.5 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Bitte wählen</option>
                      {insuranceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {editedData.type || '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Unternehmen */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Versicherungsunternehmen *
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.company}
                      onChange={(e) => setEditedData({ ...editedData, company: e.target.value })}
                      placeholder="z.B. Mobiliar, CSS, AXA"
                      className={`w-full p-2.5 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  ) : (
                    <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {editedData.company || '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Prämie */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Jährliche Prämie (CHF)
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editedData.premium}
                      onChange={(e) => setEditedData({ ...editedData, premium: e.target.value })}
                      placeholder="z.B. 450"
                      className={`w-full p-2.5 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  ) : (
                    <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {editedData.premium ? `CHF ${editedData.premium}` : '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ablaufdatum */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ablaufdatum
                  </label>
                  {editMode ? (
                    <input
                      type="date"
                      value={editedData.expiryDate}
                      onChange={(e) => setEditedData({ ...editedData, expiryDate: e.target.value })}
                      className={`w-full p-2.5 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  ) : (
                    <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {editedData.expiryDate
                          ? new Date(editedData.expiryDate).toLocaleDateString('de-CH')
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {extractedData && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                  darkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={!editedData.type || !editedData.company}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  !editedData.type || !editedData.company
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <Check className="w-5 h-5" />
                Police speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyUploader;
