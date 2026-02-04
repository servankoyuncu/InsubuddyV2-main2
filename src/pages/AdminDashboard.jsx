import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Shield,
  Image as ImageIcon, Save, X, Bell, AlertCircle, CheckCircle, Info as InfoIcon,
  Users, FileText, Briefcase, UserCheck, Phone, Mail, MessageCircle, Star, Globe,
  MapPin, BadgeCheck, Home, Car, Building, Heart, Stethoscope, PiggyBank
} from 'lucide-react';
import {
  getAllAdvisors,
  createAdvisor,
  updateAdvisor,
  deleteAdvisor,
  toggleAdvisorStatus,
  toggleAdvisorFeatured,
  ADVISOR_TOPICS,
  SWISS_CANTONS
} from '../services/advisorService';

function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('partners');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stats State
  const [stats, setStats] = useState({
    total_users: 0,
    total_policies: 0,
    total_partners: 0,
    active_notifications: 0
  });

  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'auto',
    description: '',
    logo: '',
    affiliate_link: '', 
    features: '',
    rating: 4.0,
    status: 'draft',
    display_order: 1
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  // Advisor State
  const [advisors, setAdvisors] = useState([]);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [advisorForm, setAdvisorForm] = useState({
    name: '',
    title: '',
    company: '',
    photo: '',
    bio: '',
    topics: [],
    specializations: '',
    city: '',
    canton: '',
    radius_km: 50,
    email: '',
    phone: '',
    whatsapp: '',
    languages: 'Deutsch',
    active: true,
    featured: false,
    verified: false,
    display_order: 0
  });

  const notificationTypes = [
    { value: 'info', label: 'Info', icon: InfoIcon, color: 'blue' },
    { value: 'success', label: 'Erfolg', icon: CheckCircle, color: 'green' },
    { value: 'warning', label: 'Warnung', icon: AlertCircle, color: 'orange' }
  ];

  // Daten laden (Stats, Partners, Notifications & Advisors)
  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);

    try {
      // 1. Stats laden via RPC
      const { data: statsData, error: sError } = await supabase.rpc('get_admin_stats');
      console.log('Stats RPC Result:', { statsData, sError });
      if (!sError && statsData) {
        setStats(statsData);
      } else if (sError) {
        console.error('Stats Error:', sError);
      }

      // 2. Partners laden
      const { data: partnersData, error: pError } = await supabase
        .from('partner_insurances')
        .select('*')
        .order('display_order', { ascending: true });
      if (!pError) setPartners(partnersData);

      // 3. Notifications laden
      const { data: notifsData, error: nError } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!nError) setNotifications(notifsData);

      // 4. Advisors laden
      const { data: advisorsData, error: aError } = await supabase
        .from('advisors')
        .select('*')
        .order('display_order', { ascending: true });
      if (!aError) setAdvisors(advisorsData || []);

    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  // --- HANDLER (handleSubmit, toggleStatus, etc. bleiben wie in deinem Code) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const partnerData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        logo: formData.logo,
        affiliate_link: formData.affiliate_link,
        features: formData.features.split(',').map(f => f.trim()),
        rating: parseFloat(formData.rating),
        display_order: parseInt(formData.display_order),
        status: formData.status
      };

      if (editingPartner) {
        await supabase.from('partner_insurances').update(partnerData).eq('id', editingPartner.id);
      } else {
        await supabase.from('partner_insurances').insert([partnerData]);
      }
      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('Fehler beim Speichern');
    }
  };

  const toggleStatus = async (partner) => {
    const newStatus = partner.status === 'published' ? 'draft' : 'published';
    await supabase.from('partner_insurances').update({ status: newStatus }).eq('id', partner.id);
    fetchData();
  };

  const handleToggleNotification = async (n) => {
    await supabase.from('admin_notifications').update({ active: !n.active }).eq('id', n.id);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Wirklich löschen?')) return;
    await supabase.from('partner_insurances').delete().eq('id', id);
    fetchData();
  };

  const openEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      category: partner.category,
      description: partner.description,
      logo: partner.logo || '',
      affiliate_link: partner.affiliate_link || '',
      features: partner.features ? partner.features.join(', ') : '',
      rating: partner.rating,
      status: partner.status,
      display_order: partner.display_order
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPartner(null);
    setFormData({ name: '', category: 'auto', description: '', logo: '', affiliate_link: '', features: '', rating: 4.0, status: 'draft', display_order: 1 });
  };

  const resetNotificationForm = () => {
    setEditingNotification(null);
    setNotificationForm({ title: '', message: '', type: 'info' });
  };

  // --- ADVISOR HANDLERS ---
  const resetAdvisorForm = () => {
    setEditingAdvisor(null);
    setAdvisorForm({
      name: '',
      title: '',
      company: '',
      photo: '',
      bio: '',
      topics: [],
      specializations: '',
      city: '',
      canton: '',
      radius_km: 50,
      email: '',
      phone: '',
      whatsapp: '',
      languages: 'Deutsch',
      active: true,
      featured: false,
      verified: false,
      display_order: 0
    });
  };

  const openEditAdvisor = (advisor) => {
    setEditingAdvisor(advisor);
    setAdvisorForm({
      name: advisor.name || '',
      title: advisor.title || '',
      company: advisor.company || '',
      photo: advisor.photo || '',
      bio: advisor.bio || '',
      topics: advisor.topics || [],
      specializations: advisor.specializations?.join(', ') || '',
      city: advisor.city || '',
      canton: advisor.canton || '',
      radius_km: advisor.radius_km || 50,
      email: advisor.email || '',
      phone: advisor.phone || '',
      whatsapp: advisor.whatsapp || '',
      languages: advisor.languages?.join(', ') || 'Deutsch',
      active: advisor.active ?? true,
      featured: advisor.featured ?? false,
      verified: advisor.verified ?? false,
      display_order: advisor.display_order || 0
    });
    setShowAdvisorModal(true);
  };

  const handleAdvisorSubmit = async (e) => {
    e.preventDefault();
    try {
      const advisorData = {
        name: advisorForm.name,
        title: advisorForm.title || null,
        company: advisorForm.company || null,
        photo: advisorForm.photo || null,
        bio: advisorForm.bio || null,
        topics: advisorForm.topics || [],
        specializations: advisorForm.specializations.split(',').map(s => s.trim()).filter(s => s),
        city: advisorForm.city || null,
        canton: advisorForm.canton || null,
        radius_km: parseInt(advisorForm.radius_km) || 50,
        email: advisorForm.email || null,
        phone: advisorForm.phone || null,
        whatsapp: advisorForm.whatsapp || advisorForm.phone || null,
        languages: advisorForm.languages.split(',').map(l => l.trim()).filter(l => l),
        active: advisorForm.active,
        featured: advisorForm.featured,
        verified: advisorForm.verified,
        display_order: parseInt(advisorForm.display_order) || 0
      };

      if (editingAdvisor) {
        await updateAdvisor(editingAdvisor.id, advisorData);
      } else {
        await createAdvisor(advisorData);
      }
      resetAdvisorForm();
      setShowAdvisorModal(false);
      fetchData();
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Speichern des Beraters');
    }
  };

  const handleDeleteAdvisor = async (id) => {
    if (!window.confirm('Berater wirklich löschen?')) return;
    await deleteAdvisor(id);
    fetchData();
  };

  const handleToggleAdvisorStatus = async (advisor) => {
    await toggleAdvisorStatus(advisor.id, advisor.active);
    fetchData();
  };

  const handleToggleAdvisorFeatured = async (advisor) => {
    await toggleAdvisorFeatured(advisor.id, advisor.featured);
    fetchData();
  };

  const getNotificationIcon = (type) => {
    const Icon = notificationTypes.find(t => t.value === type)?.icon || InfoIcon;
    return <Icon className="w-5 h-5" />;
  };

  const getNotificationColor = (type) => notificationTypes.find(t => t.value === type)?.color || 'blue';

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">InsuBuddy Management</p>
              </div>
            </div>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Zurück
            </button>
          </div>
          
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button onClick={() => setActiveTab('partners')} className={`pb-3 px-2 font-medium text-sm transition-colors ${activeTab === 'partners' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
              Partner
            </button>
            <button onClick={() => setActiveTab('advisors')} className={`pb-3 px-2 font-medium text-sm transition-colors ${activeTab === 'advisors' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
              Berater
            </button>
            <button onClick={() => setActiveTab('notifications')} className={`pb-3 px-2 font-medium text-sm transition-colors ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
              Benachrichtigungen
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* STATS CARDS - Hier sind die neuen Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">User</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg"><FileText className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Policen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_policies}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg"><Briefcase className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Partner</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_partners}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg"><Bell className="w-6 h-6 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Aktiv Info</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_notifications}</p>
            </div>
          </div>
        </div>

        {/* PARTNERS TAB */}
        {activeTab === 'partners' && (
          <>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" /> Neuer Partner
            </button>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {partners.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleStatus(p)} className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {p.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ADVISORS TAB */}
        {activeTab === 'advisors' && (
          <>
            <button onClick={() => { resetAdvisorForm(); setShowAdvisorModal(true); }} className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" /> Neuer Berater
            </button>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Berater</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Themen & Standort</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {advisors.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {a.photo ? (
                            <img src={a.photo} alt={a.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {a.name}
                              {a.verified && <BadgeCheck className="w-4 h-4 text-green-600" />}
                              {a.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="text-xs text-gray-500">{a.title || 'Berater'} {a.company && `• ${a.company}`}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {a.email && <Mail className="w-3 h-3 text-gray-400" />}
                              {a.phone && <Phone className="w-3 h-3 text-gray-400" />}
                              {a.whatsapp && <MessageCircle className="w-3 h-3 text-green-500" />}
                              {a.rating > 0 && (
                                <span className="text-xs text-amber-600 flex items-center gap-0.5 ml-2">
                                  <Star className="w-3 h-3 fill-amber-500" /> {a.rating?.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {a.topics && a.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {a.topics.slice(0, 3).map(t => (
                                <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                  {ADVISOR_TOPICS.find(topic => topic.id === t)?.label || t}
                                </span>
                              ))}
                              {a.topics.length > 3 && (
                                <span className="text-xs text-gray-400">+{a.topics.length - 3}</span>
                              )}
                            </div>
                          )}
                          {a.city && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {a.city}{a.canton && ` (${a.canton})`}
                              {a.radius_km && <span className="text-gray-400">• {a.radius_km} km</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <button onClick={() => handleToggleAdvisorStatus(a)} className={`px-2 py-1 rounded-full text-xs font-medium ${a.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {a.active ? 'Aktiv' : 'Inaktiv'}
                          </button>
                          <button onClick={() => handleToggleAdvisorFeatured(a)} className={`px-2 py-1 rounded-full text-xs font-medium ${a.featured ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                            <Star className={`w-3 h-3 ${a.featured ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditAdvisor(a)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteAdvisor(a.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                  {advisors.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        Noch keine Berater hinzugefügt
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <>
            <button onClick={() => { resetNotificationForm(); setShowNotificationModal(true); }} className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" /> Neue Info
            </button>
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="p-6 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex gap-4">
                    <div className={`p-2 h-fit rounded-lg bg-${getNotificationColor(n.type)}-100`}>{getNotificationIcon(n.type)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{n.title}</h3>
                      <p className="text-sm text-gray-600">{n.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleToggleNotification(n)} className={`px-3 py-1 rounded-full text-xs font-medium ${n.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {n.active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                    <button onClick={() => openEditNotification(n)} className="text-blue-600"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => alert('Löschen via Supabase Client implementieren')} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL PARTNER */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editingPartner ? 'Partner bearbeiten' : 'Neuer Partner'}</h2>
                <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                  <textarea className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Link</label>
                  <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.affiliate_link} onChange={e => setFormData({...formData, affiliate_link: e.target.value})} required />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Speichern
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Abbrechen</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* MODAL ADVISOR */}
      {showAdvisorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingAdvisor ? 'Berater bearbeiten' : 'Neuer Berater'}</h2>
              <button onClick={() => setShowAdvisorModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdvisorSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={advisorForm.name}
                    onChange={e => setAdvisorForm({...advisorForm, name: e.target.value})}
                    placeholder="Max Muster"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel/Position</label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={advisorForm.title}
                    onChange={e => setAdvisorForm({...advisorForm, title: e.target.value})}
                    placeholder="Versicherungsberater"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={advisorForm.company}
                    onChange={e => setAdvisorForm({...advisorForm, company: e.target.value})}
                    placeholder="InsuBuddy AG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto URL</label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={advisorForm.photo}
                    onChange={e => setAdvisorForm({...advisorForm, photo: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurzbeschreibung</label>
                <textarea
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                  value={advisorForm.bio}
                  onChange={e => setAdvisorForm({...advisorForm, bio: e.target.value})}
                  placeholder="Erfahrener Berater mit 10+ Jahren..."
                />
              </div>

              {/* Beratungsthemen */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-3">Beratungsthemen</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ADVISOR_TOPICS.map(topic => (
                    <label
                      key={topic.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        advisorForm.topics.includes(topic.id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={advisorForm.topics.includes(topic.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdvisorForm({...advisorForm, topics: [...advisorForm.topics, topic.id]});
                          } else {
                            setAdvisorForm({...advisorForm, topics: advisorForm.topics.filter(t => t !== topic.id)});
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{topic.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weitere Spezialisierungen (kommagetrennt)</label>
                <input
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={advisorForm.specializations}
                  onChange={e => setAdvisorForm({...advisorForm, specializations: e.target.value})}
                  placeholder="Firmenkunden, Immobilien, Startups"
                />
              </div>

              {/* Standort */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Standort & Einzugsgebiet
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                    <input
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={advisorForm.city}
                      onChange={e => setAdvisorForm({...advisorForm, city: e.target.value})}
                      placeholder="Zürich"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kanton</label>
                    <select
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={advisorForm.canton}
                      onChange={e => setAdvisorForm({...advisorForm, canton: e.target.value})}
                    >
                      <option value="">-- Wählen --</option>
                      {SWISS_CANTONS.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Umkreis (km)</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={advisorForm.radius_km}
                      onChange={e => setAdvisorForm({...advisorForm, radius_km: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Kontaktdaten */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Kontaktdaten
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-3 h-3 inline mr-1" /> E-Mail
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={advisorForm.email}
                      onChange={e => setAdvisorForm({...advisorForm, email: e.target.value})}
                      placeholder="max@example.ch"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-3 h-3 inline mr-1" /> Telefon
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={advisorForm.phone}
                      onChange={e => setAdvisorForm({...advisorForm, phone: e.target.value})}
                      placeholder="+41 79 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MessageCircle className="w-3 h-3 inline mr-1 text-green-500" /> WhatsApp
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={advisorForm.whatsapp}
                      onChange={e => setAdvisorForm({...advisorForm, whatsapp: e.target.value})}
                      placeholder="+41 79 123 45 67"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Globe className="w-3 h-3 inline mr-1" /> Sprachen
                  </label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={advisorForm.languages}
                    onChange={e => setAdvisorForm({...advisorForm, languages: e.target.value})}
                    placeholder="Deutsch, Englisch, Französisch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reihenfolge</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={advisorForm.display_order}
                    onChange={e => setAdvisorForm({...advisorForm, display_order: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advisorForm.active}
                    onChange={e => setAdvisorForm({...advisorForm, active: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Aktiv</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advisorForm.featured}
                    onChange={e => setAdvisorForm({...advisorForm, featured: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500" /> Featured
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advisorForm.verified}
                    onChange={e => setAdvisorForm({...advisorForm, verified: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4 text-green-600" /> Verifiziert
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Speichern
                </button>
                <button type="button" onClick={() => setShowAdvisorModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
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