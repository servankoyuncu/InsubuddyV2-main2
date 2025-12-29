import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield,
  Image as ImageIcon,
  Save,
  X,
  Bell,
  AlertCircle,
  CheckCircle,
  Info as InfoIcon
} from 'lucide-react';
import {
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
  getAllAdminNotifications,
  toggleNotificationStatus
} from '../services/adminNotificationService';

function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('partners');
  
  // Partner State
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'auto',
    description: '',
    logo: '',
    affiliateLink: '',
    features: '',
    rating: 4.0,
    status: 'draft',
    displayOrder: 1
  });

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info'
  });

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

  // Notification Types
  const notificationTypes = [
    { value: 'info', label: 'Info', icon: InfoIcon, color: 'blue' },
    { value: 'success', label: 'Erfolg', icon: CheckCircle, color: 'green' },
    { value: 'warning', label: 'Warnung', icon: AlertCircle, color: 'orange' }
  ];

  // Prüfe Admin-Rechte
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Partner laden
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'partnerInsurances'),
      orderBy('displayOrder', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const partnersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPartners(partnersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Notifications laden
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = getAllAdminNotifications((notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Partner hinzufügen/bearbeiten
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const partnerData = {
        ...formData,
        features: formData.features.split(',').map(f => f.trim()),
        rating: parseFloat(formData.rating),
        displayOrder: parseInt(formData.displayOrder),
        updatedAt: serverTimestamp(),
      };

      if (editingPartner) {
        await updateDoc(doc(db, 'partnerInsurances', editingPartner.id), partnerData);
      } else {
        await addDoc(collection(db, 'partnerInsurances'), {
          ...partnerData,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid
        });
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Partners');
    }
  };

  // Notification hinzufügen/bearbeiten
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingNotification) {
        await updateAdminNotification(editingNotification.id, notificationForm);
      } else {
        await createAdminNotification({
          ...notificationForm,
          createdBy: currentUser.uid
        });
      }

      resetNotificationForm();
      setShowNotificationModal(false);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Benachrichtigung');
    }
  };

  // Partner löschen
  const handleDelete = async (id) => {
    if (!window.confirm('Partner wirklich löschen?')) return;

    try {
      await deleteDoc(doc(db, 'partnerInsurances', id));
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen');
    }
  };

  // Notification löschen
  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Benachrichtigung wirklich löschen?')) return;

    try {
      await deleteAdminNotification(id);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen');
    }
  };

  // Status ändern (Published/Draft)
  const toggleStatus = async (partner) => {
    try {
      await updateDoc(doc(db, 'partnerInsurances', partner.id), {
        status: partner.status === 'published' ? 'draft' : 'published',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error);
    }
  };

  // Notification Status ändern
  const handleToggleNotification = async (notification) => {
    try {
      await toggleNotificationStatus(notification.id, notification.active);
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error);
    }
  };

  // Bearbeiten öffnen
  const openEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      category: partner.category,
      description: partner.description,
      logo: partner.logo,
      affiliateLink: partner.affiliateLink,
      features: partner.features.join(', '),
      rating: partner.rating,
      status: partner.status,
      displayOrder: partner.displayOrder
    });
    setShowModal(true);
  };

  // Notification bearbeiten öffnen
  const openEditNotification = (notification) => {
    setEditingNotification(notification);
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      type: notification.type
    });
    setShowNotificationModal(true);
  };

  // Form zurücksetzen
  const resetForm = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      category: 'auto',
      description: '',
      logo: '',
      affiliateLink: '',
      features: '',
      rating: 4.0,
      status: 'draft',
      displayOrder: 1
    });
  };

  // Notification Form zurücksetzen
  const resetNotificationForm = () => {
    setEditingNotification(null);
    setNotificationForm({
      title: '',
      message: '',
      type: 'info'
    });
  };

  // Notification Icon
  const getNotificationIcon = (type) => {
    const notifType = notificationTypes.find(t => t.value === type);
    if (!notifType) return <InfoIcon className="w-5 h-5" />;
    const Icon = notifType.icon;
    return <Icon className="w-5 h-5" />;
  };

  // Notification Color
  const getNotificationColor = (type) => {
    const notifType = notificationTypes.find(t => t.value === type);
    return notifType?.color || 'blue';
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">InsuBuddy Verwaltung</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Zurück zum Dashboard
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('partners')}
              className={`pb-3 px-2 font-medium text-sm transition-colors ${
                activeTab === 'partners'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Partner-Versicherungen
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-3 px-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              Benachrichtigungen
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Neuer Partner
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Partner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reihenfolge
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {partners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {partner.logo ? (
                              <img 
                                src={partner.logo} 
                                alt={partner.name}
                                className="w-10 h-10 rounded object-contain bg-gray-100 p-1"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{partner.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {partner.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {categories.find(c => c.value === partner.category)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">⭐ {partner.rating}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{partner.displayOrder}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(partner)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              partner.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {partner.status === 'published' ? (
                              <>
                                <Eye className="w-3 h-3" />
                                Veröffentlicht
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Entwurf
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(partner)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(partner.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {partners.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Noch keine Partner hinzugefügt</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => {
                  resetNotificationForm();
                  setShowNotificationModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Neue Benachrichtigung
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Erstelle Benachrichtigungen die alle User sehen. Perfekt für Ankündigungen, Updates oder wichtige Hinweise.
                </p>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Noch keine Benachrichtigungen erstellt</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg bg-${getNotificationColor(notification.type)}-100`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleToggleNotification(notification)}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                  notification.active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {notification.active ? (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    Aktiv
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3" />
                                    Inaktiv
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <span className={`px-2 py-1 text-xs rounded-full bg-${getNotificationColor(notification.type)}-100 text-${getNotificationColor(notification.type)}-800`}>
                              {notificationTypes.find(t => t.value === notification.type)?.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {notification.createdAt?.toLocaleDateString('de-CH', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditNotification(notification)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Partner Modal - bleibt gleich */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPartner ? 'Partner bearbeiten' : 'Neuer Partner'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliate Link *
                </label>
                <input
                  type="url"
                  value={formData.affiliateLink}
                  onChange={(e) => setFormData({ ...formData, affiliateLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (kommagetrennt)
                </label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="24/7 Support, Sofortschutz, Günstig"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reihenfolge
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Entwurf</option>
                  <option value="published">Veröffentlicht</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingNotification ? 'Benachrichtigung bearbeiten' : 'Neue Benachrichtigung'}
                </h2>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    resetNotificationForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleNotificationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Neue Features verfügbar!"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachricht *
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Beschreibe die Benachrichtigung..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {notificationTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNotificationForm({ ...notificationForm, type: type.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          notificationForm.type === type.value
                            ? `border-${type.color}-500 bg-${type.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 text-${type.color}-600`} />
                        <div className="text-xs font-medium text-gray-700">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationModal(false);
                    resetNotificationForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;