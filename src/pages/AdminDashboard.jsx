import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../supabase'; 
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Shield,
  Image as ImageIcon, Save, X, Bell, AlertCircle, CheckCircle, Info as InfoIcon,
  Users, FileText, Briefcase
} from 'lucide-react';

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

  const notificationTypes = [
    { value: 'info', label: 'Info', icon: InfoIcon, color: 'blue' },
    { value: 'success', label: 'Erfolg', icon: CheckCircle, color: 'green' },
    { value: 'warning', label: 'Warnung', icon: AlertCircle, color: 'orange' }
  ];

  // Daten laden (Stats, Partners & Notifications)
  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);

    try {
      // 1. Stats laden via RPC
      const { data: statsData, error: sError } = await supabase.rpc('get_admin_stats');
      if (!sError) setStats(statsData);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {activeTab === 'partners' ? (
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
        ) : (
          /* NOTIFICATIONS TAB */
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
    </div>
  );
}

export default AdminDashboard;