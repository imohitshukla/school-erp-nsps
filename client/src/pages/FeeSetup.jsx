import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, PlayCircle, CheckCircle, AlertCircle, Loader2, IndianRupee } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const CLASSES = [
  'J-Nursery','Nursery','LKG','UKG',
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11','Class 12',
  '1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th',
  'HM','EM',
];

const FeeSetup = () => {
  const { selectedAcademicYear } = useAppContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(null); // class_name being applied
  const [feedback, setFeedback] = useState(null);

  // Form state
  const [form, setForm] = useState({
    class_name: '',
    tuition_fee: '',
    transport_fee: '',
    other_fee: '',
  });

  const fetchTemplates = async () => {
    try {
      const res = await api.get(`/api/fee-setup?academicYear=${selectedAcademicYear}`);
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedAcademicYear]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.class_name) {
      setFeedback({ type: 'error', msg: 'Select a class first' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await api.post('/api/fee-setup', {
        ...form,
        academic_year: selectedAcademicYear,
      });
      setFeedback({ type: 'success', msg: `Fee template saved for ${form.class_name}` });
      setForm({ class_name: '', tuition_fee: '', transport_fee: '', other_fee: '' });
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (className) => {
    setApplying(className);
    setFeedback(null);
    try {
      const res = await api.post('/api/fee-setup/apply', {
        class_name: className,
        academic_year: selectedAcademicYear,
      });
      setFeedback({ type: 'success', msg: res.message });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to apply' });
    } finally {
      setApplying(null);
    }
  };

  const handleDelete = async (id, className) => {
    if (!confirm(`Delete fee template for ${className}?`)) return;
    try {
      await api.post(`/api/fee-setup/${id}`, {}); // will 404, need DELETE
    } catch (err) {
      // Use fetch directly for DELETE
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/fee-setup/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      setFeedback({ type: 'success', msg: `Template for ${className} deleted` });
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message || 'Delete failed' });
    }
  };

  const handleEdit = (tpl) => {
    setForm({
      class_name: tpl.class_name,
      tuition_fee: tpl.tuition_fee,
      transport_fee: tpl.transport_fee,
      other_fee: tpl.other_fee,
    });
  };

  // Get available classes (ones not yet templated)
  const usedClasses = templates.map(t => t.class_name);

  return (
    <div className="max-w-6xl mx-auto p-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fee Structure Setup</h1>
          <p className="text-gray-500 text-xs">Configure annual fees per class → Apply to all students</p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium mb-4 border ${
          feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add/Edit Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Plus size={16} />
                {form.class_name && usedClasses.includes(form.class_name) ? 'Edit' : 'Add'} Class Fee Template
              </h2>
              <p className="text-indigo-100 text-xs mt-0.5">Year: {selectedAcademicYear}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  value={form.class_name}
                  onChange={(e) => setForm(prev => ({ ...prev, class_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Class...</option>
                  {CLASSES.map(c => (
                    <option key={c} value={c}>{c} {usedClasses.includes(c) ? '(edit)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Tuition Fee (₹)</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="bg-gray-50 px-3 py-2.5 text-gray-500 text-sm border-r">₹</span>
                  <input
                    type="number"
                    value={form.tuition_fee}
                    onChange={(e) => setForm(prev => ({ ...prev, tuition_fee: e.target.value }))}
                    placeholder="e.g. 30000"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Monthly: ₹{form.tuition_fee ? Math.round(parseFloat(form.tuition_fee) / 12) : 0}/month</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Transport Fee (₹)</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="bg-gray-50 px-3 py-2.5 text-gray-500 text-sm border-r">₹</span>
                  <input
                    type="number"
                    value={form.transport_fee}
                    onChange={(e) => setForm(prev => ({ ...prev, transport_fee: e.target.value }))}
                    placeholder="e.g. 12000"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Monthly: ₹{form.transport_fee ? Math.round(parseFloat(form.transport_fee) / 12) : 0}/month</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Other Fees (₹)</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="bg-gray-50 px-3 py-2.5 text-gray-500 text-sm border-r">₹</span>
                  <input
                    type="number"
                    value={form.other_fee}
                    onChange={(e) => setForm(prev => ({ ...prev, other_fee: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Total Annual</span>
                  <span className="font-bold text-indigo-700">
                    ₹{((parseFloat(form.tuition_fee) || 0) + (parseFloat(form.transport_fee) || 0) + (parseFloat(form.other_fee) || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">Per Month</span>
                  <span className="text-indigo-600 font-semibold">
                    ₹{Math.round(((parseFloat(form.tuition_fee) || 0) + (parseFloat(form.transport_fee) || 0) + (parseFloat(form.other_fee) || 0)) / 12).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Templates Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 text-sm">Class Fee Templates — {selectedAcademicYear}</h2>
              <span className="text-xs text-gray-500">{templates.length} classes configured</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <IndianRupee size={40} className="mx-auto mb-2 opacity-30" />
                <p>No fee templates configured yet.</p>
                <p className="text-xs mt-1">Use the form on the left to add one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">Class</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Tuition/yr</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Transport/yr</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Other/yr</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Total/yr</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Per Month</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tpl) => {
                      const total = parseFloat(tpl.tuition_fee || 0) + parseFloat(tpl.transport_fee || 0) + parseFloat(tpl.other_fee || 0);
                      const monthly = Math.round(total / 12);
                      return (
                        <tr key={tpl.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{tpl.class_name}</td>
                          <td className="px-4 py-3 text-right">₹{parseFloat(tpl.tuition_fee).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{parseFloat(tpl.transport_fee).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{parseFloat(tpl.other_fee).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">₹{total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-indigo-600 font-semibold">₹{monthly.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleApply(tpl.class_name)}
                                disabled={applying === tpl.class_name}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                                title="Apply this fee to all students in this class"
                              >
                                {applying === tpl.class_name ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <PlayCircle size={12} />
                                )}
                                Apply
                              </button>
                              <button
                                onClick={() => handleEdit(tpl)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(tpl.id, tpl.class_name)}
                                className="text-red-400 hover:text-red-600 p-1.5 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <h3 className="font-semibold mb-2">💡 How it works</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
              <li><strong>Add Template</strong> — Set annual fees for a class (tuition + transport + other)</li>
              <li><strong>Apply</strong> — Automatically creates 12 monthly due entries (Apr–Mar) for every student in that class</li>
              <li><strong>Collect</strong> — Go to <em>Fee Payment</em> → select student → check months → take fee</li>
              <li>Monthly amount = Annual ÷ 12 (auto-calculated)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeSetup;
