import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, LogOut, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VisitorLog = () => {
  const { auth } = useAppContext();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', purpose: '', whom_to_meet: ''
  });

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/admin/visitors`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setVisitors(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) fetchVisitors();
  }, [auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/admin/visitors`, formData, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setShowForm(false);
      setFormData({ name: '', phone: '', purpose: '', whom_to_meet: '' });
      fetchVisitors();
    } catch (err) {
      setError('Failed to log visitor');
    }
  };

  const markExit = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/admin/visitors/${id}/exit`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      fetchVisitors();
    } catch (err) {
      setError('Failed to mark exit');
    }
  };

  const activeVisitors = visitors.filter(v => !v.exit_time).length;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#374151' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Visitor Log</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> New Visitor Entry
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Currently Inside Campus</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{activeVisitors}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15 }}>Log Visitor Entry</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label style={lblStyle}>Visitor Name</label>
              <input style={inpStyle} type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={lblStyle}>Phone Number</label>
              <input style={inpStyle} type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label style={lblStyle}>Whom to meet (Staff/Student)</label>
              <input style={inpStyle} type="text" value={formData.whom_to_meet} onChange={e => setFormData({...formData, whom_to_meet: e.target.value})} />
            </div>
            <div>
              <label style={lblStyle}>Purpose</label>
              <input style={inpStyle} type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Allow Entry</button>
          </div>
        </form>
      )}

      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={thStyle}>Visitor</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Purpose</th>
              <th style={thStyle}>To Meet</th>
              <th style={thStyle}>Entry Time</th>
              <th style={thStyle}>Exit Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center' }}>Loading...</td></tr> : 
             visitors.length === 0 ? <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center' }}>No visitors found</td></tr> :
             visitors.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{v.name}</td>
                <td style={tdStyle}>{v.phone}</td>
                <td style={tdStyle}>{v.purpose || '-'}</td>
                <td style={tdStyle}>{v.whom_to_meet || '-'}</td>
                <td style={tdStyle}>{new Date(v.entry_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</td>
                <td style={tdStyle}>
                  {v.exit_time ? (
                    <span style={{ color: '#6b7280' }}>{new Date(v.exit_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  ) : (
                    <button onClick={() => markExit(v.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                      Mark Exit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const lblStyle = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' };
const inpStyle = { width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box' };
const thStyle = { padding: '12px 16px', color: '#6b7280', fontSize: 13, fontWeight: 500 };
const tdStyle = { padding: '12px 16px', fontSize: 14 };

export default VisitorLog;
