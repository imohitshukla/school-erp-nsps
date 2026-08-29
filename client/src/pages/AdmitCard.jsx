import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Save, Printer, Eye, Users, Calendar, Clock, BookOpen, AlertCircle, ChevronDown, Download, X, Search } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const EXAM_TYPES = ['HALF YEARLY', 'ANNUAL', 'PT1', 'PT2'];
const DEFAULT_SUBJECTS = ['Sanskrit', 'Hindi', 'English', 'Maths', 'General Knowledge', 'Science', 'Computer', 'SST'];

const emptySubjectRow = () => ({
  subject: '',
  exam_date: '',
  start_time: '08:30 AM',
  end_time: '12:30 PM',
  room_no: ''
});

// ─────────────────────────────────────────────────────────────
// Single Admit Card Component (used in both preview & bulk)
// ─────────────────────────────────────────────────────────────
const AdmitCardTemplate = ({ student, schedule, schoolName, compact = false }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const yearDisplay = schedule.academic_year
    ? `(${schedule.academic_year.replace('-', '-20').replace('2020', '20')})`
    : '';

  const cardStyle = compact ? {
    fontSize: '9px',
    padding: '10px 14px',
    border: '2px solid #333',
    pageBreakInside: 'avoid',
    marginBottom: '8px',
    background: '#fff',
  } : {
    fontSize: '13px',
    padding: '24px 28px',
    border: '2px solid #333',
    pageBreakInside: 'avoid',
    marginBottom: '16px',
    background: '#fff',
    maxWidth: '680px',
    margin: '0 auto 16px auto',
  };

  return (
    <div style={cardStyle} className="admit-card-template">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: compact ? '6px' : '14px' }}>
        <div style={{ fontWeight: '800', fontSize: compact ? '12px' : '18px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {schoolName || 'NEW SAINIK PUBLIC SCHOOL'}
        </div>
        <div style={{ fontWeight: '600', fontSize: compact ? '9px' : '12px', marginTop: '2px' }}>
          {schedule.exam_type} {yearDisplay}
        </div>
        <div style={{ fontWeight: '700', fontSize: compact ? '10px' : '14px', textDecoration: 'underline', marginTop: '2px' }}>
          ADMIT CARD
        </div>
      </div>

      {/* Student Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: compact ? '6px' : '12px', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <div><strong>Name</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.name || '—'}</div>
            <div><strong>Class</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.class_name || '—'}{student.section ? ` ${student.section}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <div><strong>Father's Name</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.father_name || '—'}</div>
            <div><strong>Roll No.</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.adm_no || '—'}</div>
          </div>
          <div>
            <strong>Admission No.</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.adm_no || '—'}
          </div>
        </div>
        {/* Photo placeholder */}
        <div style={{
          width: compact ? '40px' : '64px',
          height: compact ? '48px' : '76px',
          border: '1px solid #999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: '#f5f5f5',
          fontSize: compact ? '6px' : '9px',
          color: '#999',
        }}>
          Photo
        </div>
      </div>

      {/* Subject Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: compact ? '6px' : '12px',
        fontSize: compact ? '8px' : '12px',
      }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={thStyle(compact)}>S.N</th>
            <th style={thStyle(compact)}>Date</th>
            <th style={{ ...thStyle(compact), textAlign: 'left' }}>Subject</th>
            <th style={thStyle(compact)}>Start Time</th>
            <th style={thStyle(compact)}>End Time</th>
            <th style={thStyle(compact)}>Room No</th>
            <th style={thStyle(compact)}>Inv. Sign</th>
          </tr>
        </thead>
        <tbody>
          {(schedule.subjects || []).map((sub, i) => (
            <tr key={i}>
              <td style={tdStyle(compact)}>{sub.serial_no || i + 1}</td>
              <td style={tdStyle(compact)}>{formatDate(sub.exam_date)}</td>
              <td style={{ ...tdStyle(compact), textAlign: 'left', fontWeight: '500' }}>{sub.subject}</td>
              <td style={tdStyle(compact)}>{sub.start_time}</td>
              <td style={tdStyle(compact)}>{sub.end_time}</td>
              <td style={tdStyle(compact)}>{sub.room_no || ''}</td>
              <td style={tdStyle(compact)}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: compact ? '10px' : '24px',
        marginBottom: compact ? '6px' : '12px',
        fontWeight: '700',
        fontSize: compact ? '8px' : '12px',
      }}>
        <div>
          <div style={{ borderTop: '1px solid #333', width: compact ? '80px' : '140px', marginBottom: '4px' }}></div>
          Sign. Class Teacher
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ borderTop: '1px solid #333', width: compact ? '80px' : '140px', marginBottom: '4px', marginLeft: 'auto' }}></div>
          Sign. Principal
        </div>
      </div>

      {/* Notes */}
      {(schedule.note_english || schedule.note_hindi) && (
        <div style={{
          fontSize: compact ? '6px' : '10px',
          color: '#444',
          borderTop: '1px solid #ddd',
          paddingTop: compact ? '3px' : '6px',
          lineHeight: '1.4',
        }}>
          {schedule.note_english && <div>Note: {schedule.note_english}</div>}
          {schedule.note_hindi && <div style={{ marginTop: '2px' }}>नोट: {schedule.note_hindi}</div>}
        </div>
      )}
    </div>
  );
};

const thStyle = (compact) => ({
  border: '1px solid #333',
  padding: compact ? '2px 3px' : '5px 8px',
  fontWeight: '600',
  textAlign: 'center',
  fontSize: compact ? '7px' : '11px',
});

const tdStyle = (compact) => ({
  border: '1px solid #333',
  padding: compact ? '2px 3px' : '4px 8px',
  textAlign: 'center',
  fontSize: compact ? '7.5px' : '11px',
});


// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
const AdmitCard = () => {
  const { selectedAcademicYear } = useAppContext();
  const [activeTab, setActiveTab] = useState('create');
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Create tab state
  const [formClass, setFormClass] = useState('');
  const [formExamType, setFormExamType] = useState(EXAM_TYPES[0]);
  const [formNoteEn, setFormNoteEn] = useState('The examination result will be declared on the 20th March 2026 and New Session will start from 23 March 2026, Monday.');
  const [formNoteHi, setFormNoteHi] = useState('परीक्षा परिणाम 20 मार्च को घोषित किया जाएगा और नया सत्र 23 मार्च 2026, दिन सोमवार से आरम्भ होगा।');
  const [subjectRows, setSubjectRows] = useState(
    DEFAULT_SUBJECTS.map(s => ({ ...emptySubjectRow(), subject: s }))
  );
  const [saving, setSaving] = useState(false);

  // Preview / Bulk tab state
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [admitCardData, setAdmitCardData] = useState(null);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const printRef = useRef(null);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/api/students/classes');
        const cls = res.data || [];
        setClasses(cls);
        if (cls.length > 0 && !formClass) setFormClass(cls[0]);
      } catch (e) {
        console.error('Failed to fetch classes', e);
      }
    };
    fetchClasses();
  }, []);

  // Fetch schedules when tab changes or year changes
  useEffect(() => {
    if (activeTab !== 'create') {
      fetchSchedules();
    }
  }, [activeTab, selectedAcademicYear]);

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/api/admit-cards/schedules?academic_year=${encodeURIComponent(selectedAcademicYear)}`);
      setSchedules(res.data || []);
    } catch (e) {
      console.error('Failed to fetch schedules', e);
    }
  };

  // ──── CREATE TAB HANDLERS ────

  const addSubjectRow = () => setSubjectRows(prev => [...prev, emptySubjectRow()]);

  const removeSubjectRow = (idx) => {
    if (subjectRows.length <= 1) return;
    setSubjectRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSubjectRow = (idx, field, value) => {
    setSubjectRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const saveSchedule = async () => {
    if (!formClass) return showMsg('Please select a class', 'error');
    const validSubjects = subjectRows.filter(s => s.subject && s.exam_date && s.start_time && s.end_time);
    if (validSubjects.length === 0) return showMsg('Add at least one subject with date & time', 'error');

    setSaving(true);
    try {
      await api.post('/api/admit-cards/schedules', {
        class_name: formClass,
        exam_type: formExamType,
        academic_year: selectedAcademicYear,
        note_english: formNoteEn,
        note_hindi: formNoteHi,
        subjects: validSubjects,
      });
      showMsg('Exam schedule saved successfully!', 'success');
    } catch (e) {
      showMsg(e.message || 'Failed to save schedule', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Load existing schedule into form for editing
  const loadScheduleForEdit = async (scheduleId) => {
    try {
      const res = await api.get(`/api/admit-cards/schedules/${scheduleId}`);
      const data = res.data;
      setFormClass(data.class_name);
      setFormExamType(data.exam_type);
      setFormNoteEn(data.note_english || '');
      setFormNoteHi(data.note_hindi || '');
      setSubjectRows(
        data.subjects.map(s => ({
          subject: s.subject,
          exam_date: s.exam_date ? s.exam_date.split('T')[0] : '',
          start_time: s.start_time,
          end_time: s.end_time,
          room_no: s.room_no || '',
        }))
      );
      setActiveTab('create');
      showMsg('Schedule loaded for editing', 'success');
    } catch (e) {
      showMsg('Failed to load schedule', 'error');
    }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Delete this exam schedule? This cannot be undone.')) return;
    try {
      await api.get(`/api/admit-cards/schedules/${id}`); // verify it exists
      // Use a workaround since api doesn't have delete
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admit-cards/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      showMsg('Schedule deleted', 'success');
      fetchSchedules();
    } catch (e) {
      showMsg('Failed to delete', 'error');
    }
  };

  // ──── GENERATE ADMIT CARDS ────

  const generateCards = async (scheduleId) => {
    if (!scheduleId) return;
    setGenerating(true);
    setAdmitCardData(null);
    try {
      const res = await api.get(`/api/admit-cards/generate/${scheduleId}`);
      setAdmitCardData(res.data);
      setSelectedStudentIdx(0);
      if (res.data.students.length === 0) {
        showMsg('No students found in this class', 'warning');
      }
    } catch (e) {
      showMsg('Failed to generate admit cards', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ──── PRINT HANDLERS ────

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = admitCardData?.students?.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.adm_no?.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  // ──── TABS ────
  const tabs = [
    { id: 'create', label: '📝 Create Schedule', icon: Calendar },
    { id: 'preview', label: '👁️ Preview & Print', icon: Eye },
    { id: 'bulk', label: '🖨️ Bulk Print', icon: Users },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 no-print-wrapper">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="text-indigo-600" size={24} />
            Admit Card Generator
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">Create exam schedules and generate class-wise admit cards.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-gray-100 p-1 rounded-lg gap-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      {/* ═══════════════ TAB 1: CREATE SCHEDULE ═══════════════ */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3">Exam Schedule Details</p>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Class</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[140px]" value={formClass} onChange={e => setFormClass(e.target.value)}>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Exam Type</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[160px]" value={formExamType} onChange={e => setFormExamType(e.target.value)}>
                  {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Academic Year</label>
                <input type="text" readOnly value={selectedAcademicYear} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 w-32 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Subject Table Editor */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  Exam Subjects & Schedule
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{subjectRows.length} subjects added</p>
              </div>
              <button onClick={addSubjectRow} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
                <Plus size={14} /> Add Subject
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-3 text-center font-medium text-gray-500 w-12">S.N</th>
                    <th className="p-3 text-left font-medium text-gray-500">Subject</th>
                    <th className="p-3 text-center font-medium text-gray-500 w-40">Date</th>
                    <th className="p-3 text-center font-medium text-gray-500 w-32">Start Time</th>
                    <th className="p-3 text-center font-medium text-gray-500 w-32">End Time</th>
                    <th className="p-3 text-center font-medium text-gray-500 w-24">Room No</th>
                    <th className="p-3 text-center font-medium text-gray-500 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subjectRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/70">
                      <td className="p-2 text-center text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.subject}
                          onChange={e => updateSubjectRow(i, 'subject', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Subject name"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={row.exam_date}
                          onChange={e => updateSubjectRow(i, 'exam_date', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.start_time}
                          onChange={e => updateSubjectRow(i, 'start_time', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="08:30 AM"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.end_time}
                          onChange={e => updateSubjectRow(i, 'end_time', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="12:30 PM"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.room_no}
                          onChange={e => updateSubjectRow(i, 'room_no', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="—"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeSubjectRow(i)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Footer Notes (printed on each admit card)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Note (English)</label>
                <textarea
                  value={formNoteEn}
                  onChange={e => setFormNoteEn(e.target.value)}
                  rows={3}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  placeholder="English note..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Note (Hindi / नोट)</label>
                <textarea
                  value={formNoteHi}
                  onChange={e => setFormNoteHi(e.target.value)}
                  rows={3}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  placeholder="हिंदी नोट..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button onClick={saveSchedule} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm">
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Exam Schedule'}
            </button>
          </div>

          {/* Existing Schedules List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Existing Schedules ({selectedAcademicYear})</h3>
            </div>
            <SchedulesList
              schedules={schedules}
              onEdit={loadScheduleForEdit}
              onDelete={deleteSchedule}
              fetchSchedules={fetchSchedules}
            />
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 2: PREVIEW & PRINT SINGLE ═══════════════ */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          {/* Schedule Selector */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-600">Select Exam Schedule</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={selectedScheduleId}
                onChange={e => {
                  setSelectedScheduleId(e.target.value);
                  if (e.target.value) generateCards(e.target.value);
                }}
              >
                <option value="">— Select —</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.class_name} — {s.exam_type} ({s.academic_year}) [{s.subject_count} subjects]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {generating && (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-3"></div>
              <p>Generating admit cards…</p>
            </div>
          )}

          {admitCardData && admitCardData.students.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student list (left) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-1">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <p className="font-semibold text-gray-700 text-sm">{admitCardData.total_students} Students</p>
                  <div className="mt-2 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search student..."
                      className="border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-50">
                  {filteredStudents.map((student, idx) => {
                    const actualIdx = admitCardData.students.indexOf(student);
                    return (
                      <div
                        key={student.adm_no}
                        onClick={() => setSelectedStudentIdx(actualIdx)}
                        className={`px-4 py-2.5 cursor-pointer transition-colors text-sm ${
                          selectedStudentIdx === actualIdx
                            ? 'bg-indigo-50 text-indigo-700 border-l-3 border-indigo-600'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-gray-400">Adm: {student.adm_no}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Preview (right) */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex justify-end">
                  <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                    <Printer size={15} />
                    Print This Card
                  </button>
                </div>
                <div id="print-area-single" className="print-area">
                  <AdmitCardTemplate
                    student={admitCardData.students[selectedStudentIdx]}
                    schedule={admitCardData.schedule}
                    schoolName={admitCardData.school_name}
                  />
                </div>
              </div>
            </div>
          )}

          {admitCardData && admitCardData.students.length === 0 && !generating && (
            <div className="text-center py-16 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No students found in this class.</p>
              <p className="text-sm mt-1">Import students first from the Data Management page.</p>
            </div>
          )}

          {!selectedScheduleId && !generating && (
            <div className="text-center py-16 text-gray-400">
              <Eye size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select an exam schedule above to preview admit cards.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 3: BULK PRINT ═══════════════ */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          {/* Schedule Selector */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-600">Select Exam Schedule for Bulk Print</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={selectedScheduleId}
                onChange={e => {
                  setSelectedScheduleId(e.target.value);
                  if (e.target.value) generateCards(e.target.value);
                }}
              >
                <option value="">— Select —</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.class_name} — {s.exam_type} ({s.academic_year}) [{s.subject_count} subjects]
                  </option>
                ))}
              </select>
            </div>
            {admitCardData && admitCardData.students.length > 0 && (
              <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
                <Printer size={16} />
                Print All ({admitCardData.total_students} Cards)
              </button>
            )}
          </div>

          {generating && (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-3"></div>
              <p>Generating admit cards…</p>
            </div>
          )}

          {admitCardData && admitCardData.students.length > 0 && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-medium flex items-center gap-2">
                <Users size={16} />
                {admitCardData.total_students} admit cards ready for {admitCardData.schedule.class_name} — {admitCardData.schedule.exam_type}
              </div>

              {/* Bulk Preview (2 per row) */}
              <div id="print-area-bulk" className="print-area">
                <div className="admit-card-bulk-grid">
                  {admitCardData.students.map((student, idx) => (
                    <AdmitCardTemplate
                      key={student.adm_no}
                      student={student}
                      schedule={admitCardData.schedule}
                      schoolName={admitCardData.school_name}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {admitCardData && admitCardData.students.length === 0 && !generating && (
            <div className="text-center py-16 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No students found in this class.</p>
            </div>
          )}

          {!selectedScheduleId && !generating && (
            <div className="text-center py-16 text-gray-400">
              <Printer size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select an exam schedule to generate bulk admit cards.</p>
              <p className="text-sm mt-1">Cards will be arranged 2 per page for A4 printing.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ PRINT STYLES (injected) ═══════════════ */}
      <style>{`
        @media print {
          /* Hide everything except the print area */
          body * {
            visibility: hidden !important;
          }
          .print-area, .print-area * {
            visibility: visible !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print-wrapper > *:not(.print-area):not(:has(.print-area)) {
            display: none !important;
          }

          /* Bulk grid: 2 cards per page */
          .admit-card-bulk-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            padding: 4px !important;
          }
          .admit-card-template {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Remove shadows, backgrounds etc */
          .admit-card-template {
            box-shadow: none !important;
          }

          @page {
            margin: 8mm;
            size: A4;
          }
        }

        /* Screen: bulk grid preview */
        .admit-card-bulk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .admit-card-bulk-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Schedules List Sub-component
// ─────────────────────────────────────────────────────────────
const SchedulesList = ({ schedules, onEdit, onDelete, fetchSchedules }) => {
  useEffect(() => { fetchSchedules(); }, []);

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No exam schedules created yet. Use the form above to create one.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {schedules.map(s => (
        <div key={s.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
          <div>
            <span className="font-semibold text-gray-800 text-sm">{s.class_name}</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-sm text-indigo-600 font-medium">{s.exam_type}</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-xs text-gray-400">{s.subject_count} subjects</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(s.id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
              Edit
            </button>
            <button onClick={() => onDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};


export default AdmitCard;
