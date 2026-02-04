import React, { useState } from 'react';
import { X, Star, ThumbsUp, Send } from 'lucide-react';
import { createReview, ADVISOR_TOPICS } from '../services/advisorService';

const ReviewModal = ({
  advisor,
  userId,
  onClose,
  onReviewSubmitted,
  darkMode = false
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [topicsConsulted, setTopicsConsulted] = useState([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Bitte geben Sie eine Bewertung ab');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createReview({
      advisorId: advisor.id,
      userId,
      rating,
      title: title.trim() || null,
      comment: comment.trim() || null,
      topicsConsulted,
      wouldRecommend
    });

    if (result.success) {
      onReviewSubmitted?.();
      onClose();
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const getRatingText = (r) => {
    switch (r) {
      case 1: return 'Schlecht';
      case 2: return 'Nicht zufrieden';
      case 3: return 'OK';
      case 4: return 'Gut';
      case 5: return 'Ausgezeichnet';
      default: return 'Bewertung wählen';
    }
  };

  // Filter topics that the advisor covers
  const availableTopics = ADVISOR_TOPICS.filter(
    topic => !advisor.topics || advisor.topics.length === 0 || advisor.topics.includes(topic.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Bewertung für {advisor.name}
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Teilen Sie Ihre Erfahrung mit anderen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Star Rating */}
          <div className="text-center">
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : darkMode ? 'text-gray-600' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className={`text-sm font-medium ${
              rating > 0
                ? rating >= 4 ? 'text-green-600' : rating >= 3 ? 'text-amber-600' : 'text-red-500'
                : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {getRatingText(hoverRating || rating)}
            </p>
          </div>

          {/* Topics Consulted */}
          {availableTopics.length > 0 && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Welche Themen wurden beraten?
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map(topic => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      if (topicsConsulted.includes(topic.id)) {
                        setTopicsConsulted(topicsConsulted.filter(t => t !== topic.id));
                      } else {
                        setTopicsConsulted([...topicsConsulted, topic.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      topicsConsulted.includes(topic.id)
                        ? 'bg-blue-500 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Titel (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Sehr kompetente Beratung"
              maxLength={100}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Comment */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Ihre Erfahrung (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beschreiben Sie Ihre Erfahrung mit diesem Berater..."
              rows={4}
              maxLength={500}
              className={`w-full px-4 py-2.5 rounded-xl border resize-none ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            <p className={`text-xs mt-1 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {comment.length}/500
            </p>
          </div>

          {/* Would Recommend */}
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <ThumbsUp className={`w-5 h-5 ${wouldRecommend ? 'text-green-500' : 'text-gray-400'}`} />
                Ich würde diesen Berater weiterempfehlen
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Bewertung abgeben
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
