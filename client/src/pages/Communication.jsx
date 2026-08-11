import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Smartphone, Mail, Bell, X } from 'lucide-react';
import api from '../services/api';

const Communication = () => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'SMS', 'Email', 'Notice'
  const [formData, setFormData] = useState({ subject: '', message: '', recipient_group: 'All Parents' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/communications');
      setCommunications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch communications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, []);

  const openModal = (type) => {
    setModalType(type);
    setFormData({ subject: '', message: '', recipient_group: 'All Parents' });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      setError('Message cannot be empty.');
      return;
    }
    if (modalType === 'Email' && !formData.subject.trim()) {
      setError('Subject is required for Email.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/api/communications', {
        type: modalType,
        subject: formData.subject,
        message: formData.message,
        recipient_group: formData.recipient_group
      });
      setSuccess(`${modalType} sent successfully!`);
      fetchCommunications();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to send ${modalType}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SMS': return <Smartphone size={18} />;
      case 'Email': return <Mail size={18} />;
      case 'Notice': return <Bell size={18} />;
      default: return <MessageSquare size={18} />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'SMS': return 'bg-indigo-50 text-indigo-600';
      case 'Email': return 'bg-purple-50 text-purple-600';
      case 'Notice': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Communication Center</h1>
          <p className="text-gray-500 mt-1">Send SMS, Emails, and manage school notices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SMS Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <Smartphone className="w-8 h-8 mb-4 text-indigo-100" />
          <h3 className="text-lg font-semibold mb-1">Send SMS</h3>
          <p className="text-indigo-100 text-sm mb-4">Instantly notify parents about fees, attendance, or emergencies.</p>
          <button onClick={() => openModal('SMS')} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm z-10 relative cursor-pointer">
            Compose SMS
          </button>
        </div>

        {/* Email Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <Mail className="w-8 h-8 mb-4 text-purple-100" />
          <h3 className="text-lg font-semibold mb-1">Send Email</h3>
          <p className="text-purple-100 text-sm mb-4">Send detailed newsletters, reports, and circulars.</p>
          <button onClick={() => openModal('Email')} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm z-10 relative cursor-pointer">
            Compose Email
          </button>
        </div>

        {/* Notice Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <Bell className="w-8 h-8 mb-4 text-emerald-100" />
          <h3 className="text-lg font-semibold mb-1">Notice Board</h3>
          <p className="text-emerald-100 text-sm mb-4">Publish notices to the student and teacher portals.</p>
          <button onClick={() => openModal('Notice')} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm z-10 relative cursor-pointer">
            Add Notice
          </button>
        </div>
      </div>

      {/* Recent Communications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Send className="w-5 h-5 mr-2 text-indigo-500" /> Recent Communications
        </h2>
        
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading communications...</div>
        ) : communications.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No recent communications found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {communications.map((comm) => (
              <div key={comm.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center group">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center ${getIconBg(comm.type)}`}>
                    {getIcon(comm.type)}
                  </div>
                  <div>
                    {comm.subject && <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{comm.subject}</p>}
                    <p className={`text-sm ${comm.subject ? 'text-gray-500' : 'text-gray-900 font-medium'} line-clamp-2 max-w-2xl`}>{comm.message}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-gray-400">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{comm.recipient_group}</span>
                      <span className={`px-2 py-0.5 rounded text-white font-medium ${comm.status === 'Sent' ? 'bg-blue-500' : 'bg-emerald-500'}`}>{comm.status}</span>
                      <span className="sm:hidden text-gray-400">{formatDate(comm.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block text-sm text-gray-400 whitespace-nowrap self-start mt-2">
                  {formatDate(comm.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {modalType === 'Notice' ? 'Publish a Notice' : `Compose New ${modalType}`}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
              {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">{success}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To (Recipients)</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.recipient_group}
                  onChange={(e) => setFormData({...formData, recipient_group: e.target.value})}
                >
                  <option value="All Parents">All Parents</option>
                  <option value="All Teachers">All Teachers</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Defaulters">Fee Defaulters</option>
                  <option value="Public (Notice Board)">Public (Notice Board)</option>
                </select>
              </div>

              {(modalType === 'Email' || modalType === 'Notice') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Title</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter subject..."
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                <textarea 
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
                {modalType === 'SMS' && (
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.message.length} chars (approx {Math.ceil(formData.message.length / 160) || 1} SMS)
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Now'}
                  {!submitting && <Send size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;
