import React, { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const CLASSES = ['LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const ACADEMIC_YEARS = ['2024-2025','2025-2026','2026-2027','2027-2028'];

const emptyForm = {
  adm_no: '',
  name: '',
  class_name: CLASSES[4],
  academic_year: '2026-2027',
  payable_fee: '',
  transport_fee: '',
  concession: '',
};

const Admission = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { success, message }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.adm_no.trim() || !form.name.trim()) {
      setResult({ success: false, message: 'Admission Number and Student Name are required.' });
      return;
    }
    setSaving(true);
    setResult(null);
    try {
      const res = await api.post('/api/students', form);
      setResult({ success: true, message: `✅ Student "${res.data.data.name}" (Adm No: ${res.data.data.adm_no}) admitted successfully!` });
      setForm(emptyForm);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to admit student. Please try again.';
      setResult({ success: false, message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Admission</h1>
          <p className="text-gray-500 text-sm mt-0.5">Register a new student into the system.</p>
        </div>
      </div>

      {result && (
        <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium border ${result.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {result.success ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <UserPlus size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">Student Admission Form</p>
            <p className="text-indigo-100 text-xs">Fill all required (*) fields</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section: Student Info */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Admission Number *" name="adm_no" value={form.adm_no} onChange={handleChange} placeholder="e.g. 2026001" required />
              <Field label="Full Name *" name="name" value={form.name} onChange={handleChange} placeholder="Student's full name" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select name="class_name" value={form.class_name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white">
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <select name="academic_year" value={form.academic_year} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white">
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Fee Details */}
          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-4">Fee Structure (Optional — can be set later)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Annual Tuition Fee (₹)" name="payable_fee" value={form.payable_fee} onChange={handleChange} placeholder="0" type="number" />
              <Field label="Transport Fee (₹)" name="transport_fee" value={form.transport_fee} onChange={handleChange} placeholder="0" type="number" />
              <Field label="Concession / Discount (₹)" name="concession" value={form.concession} onChange={handleChange} placeholder="0" type="number" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button type="button" onClick={() => setForm(emptyForm)} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Clear Form
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <UserPlus size={16} />
            {saving ? 'Admitting Student…' : 'Submit Admission'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, name, value, onChange, placeholder, type = 'text', required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition"
    />
  </div>
);

export default Admission;
