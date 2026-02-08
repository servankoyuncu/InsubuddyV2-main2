import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageCircle, Star, UserCheck, Globe, MapPin, BadgeCheck, Home, Car, Building, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import {
  generateWhatsAppLink,
  generatePhoneLink,
  generateEmailLink,
  getAdvisorReviews,
  hasUserReviewed,
  ADVISOR_TOPICS
} from '../services/advisorService';
import ReviewModal from './ReviewModal';

// Topic Icon Mapping
const TopicIcons = {
  sachversicherung: Home,
  auto: Car,
  kmu: Building,
  leben: Heart,
  krankenkasse: () => <span className="text-sm">+</span>,
  vorsorge: () => <span className="text-sm">CHF</span>
};

const AdvisorCard = ({ advisor, darkMode = false, compact = false, collapsible = false, userId = null, onReviewAdded }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (advisor?.id && !compact) {
      loadReviews();
      if (userId) {
        checkUserReview();
      }
    }
  }, [advisor?.id, userId, compact]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    const data = await getAdvisorReviews(advisor.id);
    setReviews(data);
    setLoadingReviews(false);
  };

  const checkUserReview = async () => {
    const hasReviewed = await hasUserReviewed(advisor.id, userId);
    setUserHasReviewed(hasReviewed);
  };

  if (!advisor) return null;

  const handleWhatsApp = () => {
    const message = `Hallo ${advisor.name}, ich habe Fragen zu meinen Versicherungen und würde gerne einen Beratungstermin vereinbaren.`;
    window.open(generateWhatsAppLink(advisor.whatsapp || advisor.phone, message), '_blank');
  };

  const handlePhone = () => {
    window.open(generatePhoneLink(advisor.phone), '_self');
  };

  const handleEmail = () => {
    const subject = 'Anfrage über InsuBuddy';
    const body = `Guten Tag ${advisor.name},\n\nIch habe Fragen zu meinen Versicherungen und würde mich über eine Kontaktaufnahme freuen.\n\nFreundliche Grüsse`;
    window.open(generateEmailLink(advisor.email, subject, body), '_self');
  };

  const handleReviewSubmitted = () => {
    loadReviews();
    setUserHasReviewed(true);
    onReviewAdded?.();
  };

  // Kompakte Version für Sidebar/Widget
  if (compact) {
    return (
      <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <div className="flex items-center gap-3 mb-3">
          {advisor.photo ? (
            <img src={advisor.photo} alt={advisor.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <UserCheck className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`font-semibold truncate flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {advisor.name}
              {advisor.verified && <BadgeCheck className="w-4 h-4 text-green-500" />}
            </div>
            <div className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {advisor.city && `${advisor.city} • `}{advisor.title || 'Versicherungsberater'}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(advisor.whatsapp || advisor.phone) && (
            <button
              onClick={handleWhatsApp}
              className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-1"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          )}
          {advisor.phone && (
            <button
              onClick={handlePhone}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Phone className="w-4 h-4" />
              Anrufen
            </button>
          )}
        </div>
      </div>
    );
  }

  // Collapsible Header (eingeklappt)
  const CollapsibleHeader = () => (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
      }`}
    >
      {advisor.photo ? (
        <img
          src={advisor.photo}
          alt={advisor.name}
          className="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
        />
      ) : (
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
          <UserCheck className={`w-7 h-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {advisor.name}
          {advisor.verified && <BadgeCheck className="w-4 h-4 text-green-500" />}
          {advisor.featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {advisor.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {advisor.city}
              {advisor.canton && ` (${advisor.canton})`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= (advisor.rating || 0)
                    ? 'text-amber-400 fill-amber-400'
                    : darkMode ? 'text-gray-600' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {advisor.rating ? advisor.rating.toFixed(1) : '–'}
            {advisor.reviews_count > 0 && ` (${advisor.reviews_count})`}
          </span>
        </div>
      </div>
      <div className={`${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>
    </div>
  );

  // Collapsible Version
  if (collapsible) {
    return (
      <>
        <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
          <CollapsibleHeader />

          {expanded && (
            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              {/* Expanded Content */}
              <div className="p-5">
                {/* Topics */}
                {advisor.topics && advisor.topics.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      BERATUNGSTHEMEN
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {advisor.topics.map(topicId => {
                        const topic = ADVISOR_TOPICS.find(t => t.id === topicId);
                        if (!topic) return null;
                        return (
                          <span
                            key={topicId}
                            className={`text-xs px-3 py-1.5 rounded-full ${
                              darkMode ? 'bg-gray-700 text-gray-200' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {topic.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Location Detail */}
                {advisor.city && advisor.radius_km && (
                  <div className={`flex items-center gap-2 mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="w-4 h-4" />
                    <span>{advisor.city}{advisor.canton && ` (${advisor.canton})`} • Umkreis {advisor.radius_km} km</span>
                  </div>
                )}

                {/* Bio */}
                {advisor.bio && (
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {advisor.bio}
                  </p>
                )}

                {/* Languages */}
                {advisor.languages && advisor.languages.length > 0 && (
                  <div className={`flex items-center gap-2 text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Globe className="w-4 h-4" />
                    <span>{advisor.languages.join(', ')}</span>
                  </div>
                )}

                {/* Contact Buttons */}
                <div className="space-y-2 mb-4">
                  {(advisor.whatsapp || advisor.phone) && (
                    <button
                      onClick={handleWhatsApp}
                      className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Via WhatsApp kontaktieren
                    </button>
                  )}
                  <div className="flex gap-2">
                    {advisor.phone && (
                      <button
                        onClick={handlePhone}
                        className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                          darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Phone className="w-4 h-4" />
                        Anrufen
                      </button>
                    )}
                    {advisor.email && (
                      <button
                        onClick={handleEmail}
                        className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                          darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        E-Mail
                      </button>
                    )}
                  </div>
                </div>

                {/* Reviews Section */}
                {reviews.length > 0 && (
                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Bewertungen ({reviews.length})
                      </h4>
                      {reviews.length > 2 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowAllReviews(!showAllReviews); }}
                          className={`text-sm flex items-center gap-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                        >
                          {showAllReviews ? 'Weniger' : 'Alle anzeigen'}
                          {showAllReviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(showAllReviews ? reviews : reviews.slice(0, 2)).map(review => (
                        <div
                          key={review.id}
                          className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= review.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : darkMode ? 'text-gray-600' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.title && (
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {review.title}
                              </span>
                            )}
                          </div>
                          {review.comment && (
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {review.comment}
                            </p>
                          )}
                          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(review.created_at).toLocaleDateString('de-CH')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Review Button */}
                {userId && !userHasReviewed && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className={`w-full mt-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border-2 border-dashed ${
                      darkMode
                        ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    Bewertung abgeben
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <ReviewModal
            advisor={advisor}
            userId={userId}
            darkMode={darkMode}
            onClose={() => setShowReviewModal(false)}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
      </>
    );
  }

  // Vollständige Karte (nicht collapsible)
  return (
    <>
      <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
        {/* Header mit Gradient */}
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white">
          {advisor.featured && (
            <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Empfohlen
            </div>
          )}
          <div className="flex items-center gap-4">
            {advisor.photo ? (
              <img
                src={advisor.photo}
                alt={advisor.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {advisor.name}
                {advisor.verified && <BadgeCheck className="w-5 h-5 text-green-300" />}
              </h3>
              <p className="text-blue-100">{advisor.title || 'Versicherungsberater'}</p>
              {advisor.company && (
                <p className="text-blue-200 text-sm">{advisor.company}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Location */}
          {advisor.city && (
            <div className={`flex items-center gap-2 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <MapPin className="w-4 h-4" />
              <span>
                {advisor.city}
                {advisor.canton && ` (${advisor.canton})`}
                {advisor.radius_km && (
                  <span className={`ml-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    • Umkreis {advisor.radius_km} km
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Topics */}
          {advisor.topics && advisor.topics.length > 0 && (
            <div className="mb-4">
              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                BERATUNGSTHEMEN
              </p>
              <div className="flex flex-wrap gap-2">
                {advisor.topics.map(topicId => {
                  const topic = ADVISOR_TOPICS.find(t => t.id === topicId);
                  if (!topic) return null;
                  return (
                    <span
                      key={topicId}
                      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                        darkMode ? 'bg-gray-700 text-gray-200' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {topic.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= (advisor.rating || 0)
                      ? 'text-amber-400 fill-amber-400'
                      : darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div>
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {advisor.rating ? advisor.rating.toFixed(1) : '–'}
              </span>
              <span className={`text-sm ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {advisor.reviews_count > 0 ? `(${advisor.reviews_count} Bewertungen)` : 'Noch keine Bewertungen'}
              </span>
            </div>
          </div>

          {/* Bio */}
          {advisor.bio && (
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {advisor.bio}
            </p>
          )}

          {/* Specializations */}
          {advisor.specializations && advisor.specializations.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {advisor.specializations.map((spec, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-1 rounded-full ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {advisor.languages && advisor.languages.length > 0 && (
            <div className={`flex items-center gap-2 text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Globe className="w-4 h-4" />
              <span>{advisor.languages.join(', ')}</span>
            </div>
          )}

          {/* Contact Buttons */}
          <div className="space-y-2 mb-4">
            {(advisor.whatsapp || advisor.phone) && (
              <button
                onClick={handleWhatsApp}
                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Via WhatsApp kontaktieren
              </button>
            )}

            <div className="flex gap-2">
              {advisor.phone && (
                <button
                  onClick={handlePhone}
                  className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Anrufen
                </button>
              )}
              {advisor.email && (
                <button
                  onClick={handleEmail}
                  className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  E-Mail
                </button>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Bewertungen ({reviews.length})
                </h4>
                {reviews.length > 2 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className={`text-sm flex items-center gap-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    {showAllReviews ? 'Weniger' : 'Alle anzeigen'}
                    {showAllReviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {(showAllReviews ? reviews : reviews.slice(0, 2)).map(review => (
                  <div
                    key={review.id}
                    className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : darkMode ? 'text-gray-600' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.title && (
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {review.title}
                        </span>
                      )}
                    </div>
                    {review.comment && (
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {review.comment}
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(review.created_at).toLocaleDateString('de-CH')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Review Button */}
          {userId && !userHasReviewed && (
            <button
              onClick={() => setShowReviewModal(true)}
              className={`w-full mt-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border-2 border-dashed ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              <Star className="w-4 h-4" />
              Bewertung abgeben
            </button>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          advisor={advisor}
          userId={userId}
          darkMode={darkMode}
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
};

export default AdvisorCard;
