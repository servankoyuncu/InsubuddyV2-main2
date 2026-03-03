import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, RotateCcw } from 'lucide-react';
import { askPolicyChat } from '../services/chatService';

const SUGGESTED_QUESTIONS = [
  'Bin ich gedeckt wenn mein Velo gestohlen wird?',
  'Was passiert wenn ich einen Wasserschaden habe?',
  'Welche Selbstbehalte habe ich bei meinen Policen?',
  'Bin ich im Ausland versichert?',
  'Wann laufen meine Policen ab?',
  'Was kostet mich meine Versicherung pro Monat?'
];

const MessageBubble = ({ message, darkMode }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser
          ? 'bg-blue-600'
          : 'bg-gradient-to-br from-indigo-500 to-purple-600'
      }`}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-blue-600 text-white rounded-tr-sm'
          : darkMode
            ? 'bg-gray-700 text-gray-100 rounded-tl-sm'
            : 'bg-white text-gray-900 rounded-tl-sm shadow-sm border border-gray-100'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

const PolicyChat = ({ darkMode = false, policies = [] }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    const question = text.trim();
    if (!question || isLoading) return;

    setHasStarted(true);
    setError(null);
    setInput('');

    // User-Nachricht sofort anzeigen
    const userMsg = { role: 'user', content: question };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Gesprächsverlauf für die API (nur role + content, kein state)
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const { answer } = await askPolicyChat(question, history);

      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setError(err.message || 'Etwas ist schiefgelaufen. Bitte versuche es nochmals.');
      // User-Nachricht bei Fehler entfernen
      setMessages(messages);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([]);
    setHasStarted(false);
    setError(null);
    setInput('');
  };

  const hasPolicies = policies.length > 0;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 220px)' }}>

      {/* Header Info */}
      {!hasStarted && (
        <div className={`rounded-2xl p-5 mb-4 ${
          darkMode
            ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700/30'
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                InsuBuddy KI-Assistent
              </h3>
              <p className={`text-xs ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                Powered by Claude AI
              </p>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Ich analysiere deine {hasPolicies ? `${policies.length} hochgeladenen Police${policies.length !== 1 ? 'n' : ''}` : 'Policen'} und beantworte deine Versicherungsfragen.
          </p>

          {!hasPolicies && (
            <div className={`mt-3 p-3 rounded-xl text-xs ${darkMode ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/30' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
              ⚠️ Lade zuerst deine Policen hoch, damit ich dir gezielt helfen kann.
            </div>
          )}
        </div>
      )}

      {/* Suggested Questions (nur wenn noch kein Chat) */}
      {!hasStarted && hasPolicies && (
        <div className="mb-4">
          <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Beispielfragen:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className={`text-xs px-3 py-2 rounded-xl border transition-all ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-300 hover:bg-indigo-900/20'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto pb-2">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} darkMode={darkMode} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${darkMode ? 'bg-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={`text-xs px-4 py-3 rounded-xl mb-4 ${darkMode ? 'bg-red-900/30 text-red-300 border border-red-700/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Reset button (wenn Chat läuft) */}
      {hasStarted && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            Neues Gespräch
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0">
        <div className={`flex gap-2 items-end rounded-2xl border p-2 ${
          darkMode
            ? 'bg-gray-800 border-gray-600 focus-within:border-indigo-500'
            : 'bg-white border-gray-200 focus-within:border-indigo-400 shadow-sm'
        } transition-colors`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Stelle eine Frage zu deinen Versicherungen..."
            rows={1}
            className={`flex-1 resize-none bg-transparent text-sm outline-none px-2 py-1.5 max-h-32 ${
              darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
            style={{ overflowY: 'auto' }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/30'
                : darkMode
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className={`text-center text-[10px] mt-1.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          KI-Antworten ersetzen keine Rechtsberatung
        </p>
      </form>
    </div>
  );
};

export default PolicyChat;
