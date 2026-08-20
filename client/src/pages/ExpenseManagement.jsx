import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, Plus, Calendar, Tag, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ExpenseManagement = () => {
  const { auth } = useAppContext();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', category: '', amount: '', expense_date: new Date().toISOString().split('T')[0], description: ''
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/admin/expenses`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setExpenses(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) fetchExpenses();
  }, [auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/admin/expenses`, formData, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setShowForm(false);
      setFormData({ title: '', category: '', amount: '', expense_date: new Date().toISOString().split('T')[0], description: '' });
      fetchExpenses();
    } catch (err) {
      setError('Failed to add expense');
    }
  };

  const totalThisMonth = expenses.reduce((sum, exp) => {
    const expDate = new Date(exp.expense_date);
    const now = new Date();
    if (expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()) {
      return sum + parseFloat(exp.amount);
    }
    return sum;
  }, 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#374151' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Expense Management</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Total Expenses (This Month)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>₹{totalThisMonth.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15 }}>Log New Expense</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label style={lblStyle}>Title</label>
              <input style={inpStyle} type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Office Supplies" />
            </div>
            <div>
              <label style={lblStyle}>Category</label>
              <select style={inpStyle} required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">Select Category</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Supplies">Supplies</option>
                <option value="Utilities">Utilities</option>
                <option value="Events">Events</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={lblStyle}>Amount (₹)</label>
              <input style={inpStyle} type="number" required min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div>
              <label style={lblStyle}>Date</label>
              <input style={inpStyle} type="date" required value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lblStyle}>Description (Optional)</label>
              <textarea style={inpStyle} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2}></textarea>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Save Expense</button>
          </div>
        </form>
      )}

      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center' }}>Loading...</td></tr> : 
             expenses.length === 0 ? <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center' }}>No expenses found</td></tr> :
             expenses.map(exp => (
              <tr key={exp.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{new Date(exp.expense_date).toLocaleDateString()}</td>
                <td style={tdStyle}>{exp.title}</td>
                <td style={tdStyle}>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{exp.category}</span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#ef4444' }}>₹{parseFloat(exp.amount).toLocaleString('en-IN')}</td>
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

export default ExpenseManagement;
