import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Plus, Trash2, PlayCircle, CheckCircle, AlertCircle,
  Loader2, IndianRupee, Users, Search, Edit3, Save, X, ChevronDown,
} from 'lucide-react';
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

const fmt = (n) =>
  '₹' + (parseFloat(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Class Fee Templates (existing logic)
// ══════════════════════════════════════════════════════════════════════════════
function ClassTemplatesTab({ selectedAcademicYear }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    class_name: '', tuition_fee: '', transport_fee: '', other_fee: '',
    admission_fee: '', annual_fee: '', id_card_fee: '', exam_fee: '',
  });

  const fetchTemplates = async () => {
    try {
      const res = await api.get(`/api/fee-setup?academicYear=${selectedAcademicYear}`);
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, [selectedAcademicYear]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.class_name) { setFeedback({ type: 'error', msg: 'Select a class first' }); return; }
    setSaving(true); setFeedback(null);
    try {
      await api.post('/api/fee-setup', { ...form, academic_year: selectedAcademicYear });
      setFeedback({ type: 'success', msg: `Fee template saved for ${form.class_name}` });
      setForm({ class_name: '', tuition_fee: '', transport_fee: '', other_fee: '', admission_fee: '', annual_fee: '', id_card_fee: '', exam_fee: '' });
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to save' });
    } finally { setSaving(false); }
  };

  const handleApply = async (className) => {
    setApplying(className); setFeedback(null);
    try {
      const res = await api.post('/api/fee-setup/apply', { class_name: className, academic_year: selectedAcademicYear });
      setFeedback({ type: 'success', msg: res.message });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to apply' });
    } finally { setApplying(null); }
  };

  const handleDelete = async (id, className) => {
    if (!confirm(`Delete fee template for ${className}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/fee-setup/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setFeedback({ type: 'success', msg: `Template for ${className} deleted` });
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message || 'Delete failed' });
    }
  };

  const handleEdit = (tpl) => setForm({
    class_name: tpl.class_name, tuition_fee: tpl.tuition_fee, transport_fee: tpl.transport_fee,
    other_fee: tpl.other_fee, admission_fee: tpl.admission_fee || '',
    annual_fee: tpl.annual_fee || '', id_card_fee: tpl.id_card_fee || '', exam_fee: tpl.exam_fee || '',
  });

  const usedClasses = templates.map(t => t.class_name);

  return (
    <div>
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium mb-4 border ${
          feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
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
                  {CLASSES.map(c => <option key={c} value={c}>{c} {usedClasses.includes(c) ? '(edit)' : ''}</option>)}
                </select>
              </div>

              {[
                { key: 'tuition_fee', label: 'Annual Tuition Fee', showMonthly: true },
                { key: 'transport_fee', label: 'Annual Transport Fee (default)', showMonthly: true },
                { key: 'other_fee', label: 'Annual Other Fees', showMonthly: false },
              ].map(({ key, label, showMonthly }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label} (₹)</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                    <span className="bg-gray-50 px-3 py-2.5 text-gray-500 text-sm border-r">₹</span>
                    <input
                      type="number" value={form[key]}
                      onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="0" className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  {showMonthly && form[key] && (
                    <p className="text-xs text-gray-400 mt-1">Monthly: ₹{Math.round(parseFloat(form[key]) / 12).toLocaleString()}/mo</p>
                  )}
                </div>
              ))}

              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Monthly Total</span>
                  <span className="font-bold text-indigo-700">
                    ₹{Math.round(((parseFloat(form.tuition_fee)||0)+(parseFloat(form.transport_fee)||0)+(parseFloat(form.other_fee)||0))/12).toLocaleString()}/mo
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500"/>
                  <h3 className="text-sm font-bold text-gray-700">One-Time Charges <span className="text-xs text-amber-600 font-normal">(per year)</span></h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'admission_fee', label: 'Admission Fee' },
                    { key: 'annual_fee',    label: 'Annual / Dev. Charge' },
                    { key: 'id_card_fee',  label: 'ID Card Fee' },
                    { key: 'exam_fee',     label: 'Exam Fee' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label} (₹)</label>
                      <div className="flex items-center border border-amber-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
                        <span className="bg-amber-50 px-2 py-2 text-amber-600 text-xs border-r">₹</span>
                        <input
                          type="number" value={form[key]}
                          onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="0" className="flex-1 px-2 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 bg-amber-50 rounded-lg p-2 flex justify-between text-xs">
                  <span className="text-amber-700 font-medium">Total One-Time</span>
                  <span className="text-amber-800 font-bold">
                    ₹{((parseFloat(form.admission_fee)||0)+(parseFloat(form.annual_fee)||0)+(parseFloat(form.id_card_fee)||0)+(parseFloat(form.exam_fee)||0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
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
                      <th className="text-right px-4 py-2.5 font-semibold">Per Month</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tpl) => {
                      const total = parseFloat(tpl.tuition_fee||0)+parseFloat(tpl.transport_fee||0)+parseFloat(tpl.other_fee||0);
                      return (
                        <tr key={tpl.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{tpl.class_name}</td>
                          <td className="px-4 py-3 text-right">{fmt(tpl.tuition_fee)}</td>
                          <td className="px-4 py-3 text-right">{fmt(tpl.transport_fee)}</td>
                          <td className="px-4 py-3 text-right text-indigo-600 font-semibold">{fmt(Math.round(total/12))}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleApply(tpl.class_name)} disabled={applying === tpl.class_name}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50">
                                {applying === tpl.class_name ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                                Apply
                              </button>
                              <button onClick={() => handleEdit(tpl)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded text-xs font-medium transition-colors">
                                Edit
                              </button>
                              <button onClick={() => handleDelete(tpl.id, tpl.class_name)}
                                className="text-red-400 hover:text-red-600 p-1.5 rounded transition-colors">
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

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <h3 className="font-semibold mb-2">💡 How it works</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
              <li><strong>Add Template</strong> — Set default annual fees for a class</li>
              <li><strong>Apply</strong> — Automatically creates 12 monthly due entries (Apr–Mar) for every student in that class</li>
              <li><strong>Override</strong> — Use the "Student Fees" tab to set individual transport fees</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Student-Level Fee Overrides
// ══════════════════════════════════════════════════════════════════════════════
function StudentFeesTab({ selectedAcademicYear }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [editingId, setEditingId] = useState(null); // adm_no being edited
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch distinct class list
  useEffect(() => {
    api.get('/api/students/classes').then(r => setClasses(r.data || [])).catch(() => {});
  }, [selectedAcademicYear]);

  const fetchStudents = useCallback(async (cls) => {
    if (!cls) return;
    setLoadingStudents(true);
    setStudents([]);
    setEditingId(null);
    try {
      const res = await api.get(`/api/students?class_name=${encodeURIComponent(cls)}&academic_year=${selectedAcademicYear}`);
      setStudents(res.data || []);
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Failed to load students' });
    } finally { setLoadingStudents(false); }
  }, [selectedAcademicYear]);

  const handleClassChange = (cls) => {
    setSelectedClass(cls);
    setSearchQ('');
    fetchStudents(cls);
  };

  const startEdit = (student) => {
    setEditingId(student.adm_no);
    setEditValues({
      payable_fee:   student.payable_fee   || 0,
      transport_fee: student.transport_fee || 0,
      concession:    student.concession    || 0,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = async (adm_no) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.put(
        `/api/students/${encodeURIComponent(adm_no)}/fees?academicYear=${selectedAcademicYear}`,
        { ...editValues, academic_year: selectedAcademicYear }
      );
      const updated = res.data;
      setStudents(prev => prev.map(s => s.adm_no === adm_no ? { ...s, ...updated } : s));
      setEditingId(null);
      setFeedback({ type: 'success', msg: `Fees updated for ${updated.name}` });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to save' });
    } finally { setSaving(false); }
  };

  // Filter by search
  const displayed = students.filter(s => {
    const q = searchQ.toLowerCase();
    return !q || s.name?.toLowerCase().includes(q) || s.adm_no?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium border ${
          feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
          <button onClick={() => setFeedback(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-xs text-gray-500 mb-3">
          Select a class to view all students and individually override their transport fee, tuition, or concession.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Class picker */}
          <div className="relative flex-1">
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
            >
              <option value="">— Select a Class —</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Search within class */}
          {selectedClass && (
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search by name or adm no…" value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Student Table */}
      {selectedClass && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Users size={15} className="text-indigo-500" />
              {selectedClass} — Individual Fee Settings
            </h2>
            <span className="text-xs text-gray-500">{displayed.length} students</span>
          </div>

          {loadingStudents ? (
            <div className="p-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading students…
            </div>
          ) : displayed.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <Users size={36} className="mx-auto mb-2 opacity-25" />
              No students found{searchQ ? ` matching "${searchQ}"` : ' in this class'}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Adm No</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Tuition (₹/yr)</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Transport (₹/yr)</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Concession (₹)</th>
                    <th className="text-center px-4 py-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((student) => {
                    const isEditing = editingId === student.adm_no;
                    return (
                      <tr key={student.adm_no} className={`border-b border-gray-100 transition-colors ${isEditing ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-2.5 font-mono text-gray-600 text-xs">{student.adm_no}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800">{student.name}</p>
                          {student.father_name && <p className="text-xs text-gray-400">F: {student.father_name}</p>}
                        </td>

                        {isEditing ? (
                          <>
                            <td className="px-4 py-2">
                              <input
                                type="number" min="0"
                                value={editValues.payable_fee}
                                onChange={(e) => setEditValues(p => ({ ...p, payable_fee: e.target.value }))}
                                className="w-28 border border-indigo-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number" min="0"
                                value={editValues.transport_fee}
                                onChange={(e) => setEditValues(p => ({ ...p, transport_fee: e.target.value }))}
                                className="w-28 border border-indigo-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number" min="0"
                                value={editValues.concession}
                                onChange={(e) => setEditValues(p => ({ ...p, concession: e.target.value }))}
                                className="w-24 border border-indigo-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => saveEdit(student.adm_no)}
                                  disabled={saving}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                  Save
                                </button>
                                <button onClick={cancelEdit}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                              {fmt(student.payable_fee)}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {parseFloat(student.transport_fee || 0) > 0 ? (
                                <span className="font-medium text-teal-700">{fmt(student.transport_fee)}</span>
                              ) : (
                                <span className="text-gray-400 text-xs">— none —</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {parseFloat(student.concession || 0) > 0 ? (
                                <span className="font-medium text-red-500">-{fmt(student.concession)}</span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => startEdit(student)}
                                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded transition-colors"
                                title="Edit this student's fees"
                              >
                                <Edit3 size={14} />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedClass && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-500">Select a class above to manage individual student fees</p>
          <p className="text-sm mt-1">Each student can have a different transport fee, tuition override, or concession amount</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — FeeSetup with tabs
// ══════════════════════════════════════════════════════════════════════════════
const FeeSetup = () => {
  const { selectedAcademicYear } = useAppContext();
  const [activeTab, setActiveTab] = useState('class');

  const tabs = [
    { id: 'class',   label: 'Class Templates', icon: <Settings size={15} /> },
    { id: 'student', label: 'Student Fees',     icon: <Users    size={15} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fee Structure Setup</h1>
          <p className="text-gray-500 text-xs">Set class-wide templates or override fees per individual student</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-white text-indigo-700 shadow font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'class'   && <ClassTemplatesTab selectedAcademicYear={selectedAcademicYear} />}
      {activeTab === 'student' && <StudentFeesTab    selectedAcademicYear={selectedAcademicYear} />}
    </div>
  );
};

export default FeeSetup;
