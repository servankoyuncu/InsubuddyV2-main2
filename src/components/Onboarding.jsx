import React, { useState } from 'react';
import { Shield, FileText, TrendingUp, Bell, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

const Onboarding = ({ onComplete, darkMode = false }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Shield,
      title: "Willkommen bei InsuBuddy",
      subtitle: "Dein persönlicher Versicherungsmanager",
      description: "Behalte alle deine Versicherungen im Überblick, spare Geld und verpasse nie wieder eine Frist.",
      color: "#3B82F6",
      tips: [
        "Alle Policen an einem Ort",
        "Kostenlose Nutzung",
        "Schweizer Datenschutz"
      ]
    },
    {
      icon: FileText,
      title: "Policen verwalten",
      subtitle: "Alle Versicherungen im Griff",
      description: "Füge deine Versicherungspolicen hinzu und habe alle wichtigen Informationen immer griffbereit.",
      color: "#8B5CF6",
      tips: [
        "Policen einfach erfassen",
        "Alle Details speichern",
        "Deckungen im Detail anzeigen"
      ]
    },
    {
      icon: TrendingUp,
      title: "Kosten analysieren",
      subtitle: "Behalte deine Finanzen im Blick",
      description: "Sieh auf einen Blick, wie viel du für Versicherungen ausgibst und wo du sparen kannst.",
      color: "#F59E0B",
      tips: [
        "Monatliche & jährliche Übersicht",
        "Einsparpotenzial entdecken",
        "Budget festlegen & überwachen"
      ]
    },
    {
      icon: Bell,
      title: "Nie wieder Fristen verpassen",
      subtitle: "Automatische Erinnerungen",
      description: "Werde rechtzeitig an ablaufende Policen erinnert und verpasse keine Kündigungsfrist mehr.",
      color: "#EF4444",
      tips: [
        "Erinnerungen aktivieren",
        "Tage vor Ablauf wählen",
        "Push-Benachrichtigungen"
      ]
    },
    {
      icon: Sparkles,
      title: "Los geht's!",
      subtitle: "Du bist bereit",
      description: "Füge jetzt deine erste Police hinzu und entdecke alle Funktionen von InsuBuddy.",
      color: "#3B82F6",
      tips: [
        "Erste Police hinzufügen",
        "Wertgegenstände erfassen",
        "Finanzübersicht entdecken"
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className={`absolute top-4 right-4 p-2 rounded-full z-10 transition-colors ${
            darkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient */}
        <div
          className="relative h-56 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${currentStepData.color}20 0%, ${currentStepData.color}40 100%)`
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute w-32 h-32 rounded-full opacity-20"
            style={{
              background: currentStepData.color,
              top: '-20px',
              right: '-20px',
              filter: 'blur(40px)'
            }}
          />
          <div
            className="absolute w-24 h-24 rounded-full opacity-20"
            style={{
              background: currentStepData.color,
              bottom: '20px',
              left: '-10px',
              filter: 'blur(30px)'
            }}
          />

          {/* Icon */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: currentStepData.color }}
          >
            <IconComponent className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-6'
                    : 'w-1.5'
                }`}
                style={{
                  backgroundColor: index === currentStep
                    ? currentStepData.color
                    : darkMode ? '#374151' : '#E5E7EB'
                }}
              />
            ))}
          </div>

          {/* Title */}
          <h2
            className={`text-2xl font-bold text-center mb-1 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {currentStepData.title}
          </h2>

          {/* Subtitle */}
          <p
            className="text-center mb-4 font-medium"
            style={{ color: currentStepData.color }}
          >
            {currentStepData.subtitle}
          </p>

          {/* Description */}
          <p
            className={`text-center mb-6 leading-relaxed ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {currentStepData.description}
          </p>

          {/* Tips */}
          <div className={`rounded-2xl p-4 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            {currentStepData.tips.map((tip, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 ${index > 0 ? 'mt-3' : ''}`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${currentStepData.color}20` }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: currentStepData.color }}
                  >
                    {index + 1}
                  </span>
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {tip}
                </span>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className={`flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Zurück
              </button>
            )}

            <button
              onClick={handleNext}
              className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isFirstStep ? 'w-full' : ''
              }`}
              style={{
                backgroundColor: currentStepData.color,
                boxShadow: `0 4px 14px ${currentStepData.color}40`
              }}
            >
              {isLastStep ? 'Jetzt starten' : 'Weiter'}
              {!isLastStep && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
