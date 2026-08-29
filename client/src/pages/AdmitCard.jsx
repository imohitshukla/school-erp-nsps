import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Trash2, Save, Printer, Eye, Users, 
  Calendar, BookOpen, AlertCircle, RefreshCw, Search,
  CheckCircle, Sparkles, HelpCircle
} from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const EXAM_TYPES = ['HALF YEARLY', 'ANNUAL', 'PT1', 'PT2', 'PRE-BOARD', 'UNIT TEST'];

// Class-specific subject presets — tailored by grade level
const CLASS_SUBJECT_PRESETS = {
  // Pre-Primary (Nursery, LKG, UKG, Playgroup)
  pre_primary: ['English', 'Hindi', 'Mathematics', 'General Knowledge', 'Drawing & Art', 'Rhymes & Oral'],
  
  // Primary (Class 1 to 5): Includes Sanskrit, EVS/Science, GK
  primary: ['Hindi', 'English', 'Maths', 'Sanskrit', 'General Knowledge', 'Science', 'Computer', 'SST'],
  
  // Middle School (Class 6 to 8): Sanskrit is present, Social Science
  middle: ['Hindi', 'English', 'Maths', 'Sanskrit', 'Science', 'Social Science', 'Computer'],
  
  // High School (Class 9 to 10): NO Sanskrit! Core subjects + IT/Computer / AI / Physical Ed
  secondary: ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Information Technology', 'Physical Education'],
  
  // Senior Secondary (Class 11 to 12): NO Sanskrit! Science / Commerce streams
  senior_science: ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Physical Education', 'Computer Science'],
  senior_commerce: ['English', 'Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Physical Education'],
};

// All common subject names for auto-suggestions / datalist
const ALL_COMMON_SUBJECTS = [
  'Hindi', 'English', 'Mathematics', 'Maths', 'Science', 'Social Science', 'SST',
  'Sanskrit', 'Computer', 'Information Technology', 'General Knowledge', 'GK',
  'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Business Studies', 'Economics',
  'History', 'Geography', 'Political Science', 'Physical Education', 'Art / Drawing',
  'Environmental Studies (EVS)', 'Moral Science', 'Music'
];

/**
 * Detects grade level from class string (e.g., "Class 10", "10th A", "IX", "5th", "LKG", "UKG")
 */
export const getSubjectsForClass = (className) => {
  if (!className) return CLASS_SUBJECT_PRESETS.primary;
  const raw = className.toString().trim().toUpperCase();
  const clean = raw.replace(/\s+/g, '');

  // Pre-primary
  if (['NUR', 'LKG', 'UKG', 'PREP', 'PLAY', 'KG'].some(k => clean.includes(k))) {
    return CLASS_SUBJECT_PRESETS.pre_primary;
  }

  // Roman Numerals check
  if (/\b(XII|12TH|12)\b/.test(raw) || clean.includes('12') || clean.includes('XII')) {
    return CLASS_SUBJECT_PRESETS.senior_science;
  }
  if (/\b(XI|11TH|11)\b/.test(raw) || clean.includes('11') || clean.includes('XI')) {
    return CLASS_SUBJECT_PRESETS.senior_science;
  }
  if (/\b(X|10TH|10)\b/.test(raw) || clean.includes('10') || clean === 'X' || clean.startsWith('X-') || clean.startsWith('X_')) {
    return CLASS_SUBJECT_PRESETS.secondary; // No Sanskrit
  }
  if (/\b(IX|9TH|9)\b/.test(raw) || clean.includes('9') || clean === 'IX' || clean.startsWith('IX-') || clean.startsWith('IX_')) {
    return CLASS_SUBJECT_PRESETS.secondary; // No Sanskrit
  }
  if (/\b(VIII|8TH|8)\b/.test(raw) || clean.includes('8') || clean.includes('VIII')) {
    return CLASS_SUBJECT_PRESETS.middle;
  }
  if (/\b(VII|7TH|7)\b/.test(raw) || clean.includes('7') || clean.includes('VII')) {
    return CLASS_SUBJECT_PRESETS.middle;
  }
  if (/\b(VI|6TH|6)\b/.test(raw) || clean.includes('6') || clean.includes('VI')) {
    return CLASS_SUBJECT_PRESETS.middle;
  }

  // Numeric check (1 to 5)
  const numMatch = clean.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (num >= 11) return CLASS_SUBJECT_PRESETS.senior_science;
    if (num >= 9) return CLASS_SUBJECT_PRESETS.secondary; // 9 & 10: No Sanskrit
    if (num >= 6) return CLASS_SUBJECT_PRESETS.middle;
    return CLASS_SUBJECT_PRESETS.primary;
  }

  return CLASS_SUBJECT_PRESETS.primary;
};

const emptySubjectRow = (subj = '') => ({
  subject: subj,
  exam_date: '',
  start_time: '08:30 AM',
  end_time: '12:30 PM',
  room_no: ''
});

// ─────────────────────────────────────────────────────────────
// Single Admit Card Component (Used for Individual & Bulk)
// ─────────────────────────────────────────────────────────────
const AdmitCardTemplate = ({ student, schedule, schoolName, compact = false }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Handle YYYY-MM-DD or ISO string
      const clean = dateStr.toString().split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const yearDisplay = schedule.academic_year
    ? `(${schedule.academic_year.replace('-', '-20').replace('2020', '20')})`
    : '';

  const cardStyle = compact ? {
    fontSize: '9px',
    padding: '10px 14px',
    border: '2px solid #1f2937',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    marginBottom: '8px',
    background: '#fff',
    color: '#000',
  } : {
    fontSize: '13px',
    padding: '24px 28px',
    border: '2px solid #1f2937',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    marginBottom: '16px',
    background: '#fff',
    maxWidth: '680px',
    margin: '0 auto 16px auto',
    color: '#000',
  };

  return (
    <div style={cardStyle} className="admit-card-template shadow-sm">
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
        <div style={{ flex: 1, lineHeight: compact ? '1.3' : '1.6' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <div><strong>Name</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.name || '—'}</div>
            <div><strong>Class</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.class_name || schedule.class_name || '—'}{student.section ? ` ${student.section}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <div><strong>Father's Name</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.father_name || '—'}</div>
            <div><strong>Roll No.</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.adm_no || '—'}</div>
          </div>
          <div>
            <strong>Admission No.</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.adm_no || '—'}
          </div>
        </div>
        {/* Photo Box */}
        <div style={{
          width: compact ? '42px' : '68px',
          height: compact ? '50px' : '80px',
          border: '1px solid #6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: '#f9fafb',
          fontSize: compact ? '7px' : '10px',
          color: '#6b7280',
          fontWeight: '500'
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
          <tr style={{ background: '#f3f4f6' }}>
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
              <td style={{ ...tdStyle(compact), textAlign: 'left', fontWeight: '600' }}>{sub.subject}</td>
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
        marginTop: compact ? '12px' : '26px',
        marginBottom: compact ? '6px' : '12px',
        fontWeight: '700',
        fontSize: compact ? '8.5px' : '12px',
      }}>
        <div>
          <div style={{ borderTop: '1px solid #1f2937', width: compact ? '85px' : '140px', marginBottom: '4px' }}></div>
          Sign. Class Teacher
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ borderTop: '1px solid #1f2937', width: compact ? '85px' : '140px', marginBottom: '4px', marginLeft: 'auto' }}></div>
          Sign. Principal
        </div>
      </div>

      {/* Notes Section */}
      {(schedule.note_english || schedule.note_hindi) && (
        <div style={{
          fontSize: compact ? '6.5px' : '10.5px',
          color: '#374151',
          borderTop: '1px solid #e5e7eb',
          paddingTop: compact ? '4px' : '8px',
          lineHeight: '1.4',
        }}>
          {schedule.note_english && <div>Note: {schedule.note_english}</div>}
          {schedule.note_hindi && <div style={{ marginTop: '2px' }}>नोट : {schedule.note_hindi}</div>}
        </div>
      )}
    </div>
  );
};

const thStyle = (compact) => ({
  border: '1px solid #1f2937',
  padding: compact ? '2px 4px' : '6px 8px',
  fontWeight: '700',
  textAlign: 'center',
  fontSize: compact ? '7.5px' : '11px',
});

const tdStyle = (compact) => ({
  border: '1px solid #1f2937',
  padding: compact ? '2px 4px' : '5px 8px',
  textAlign: 'center',
  fontSize: compact ? '8px' : '11px',
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

  // Form State for Schedule Creation
  const [formClass, setFormClass] = useState('');
  const [formExamType, setFormExamType] = useState(EXAM_TYPES[0]);
  const [formNoteEn, setFormNoteEn] = useState('The examination result will be declared on the 20th March 2026 and New Session will start from 23 March 2026, Monday.');
  const [formNoteHi, setFormNoteHi] = useState('परीक्षा परिणाम 20 मार्च को घोषित किया जाएगा और नया सत्र 23 मार्च 2026, दिन सोमवार से आरम्भ होगा।');
  const [subjectRows, setSubjectRows] = useState([]);
  const [saving, setSaving] = useState(false);

  // Preview & Bulk Tab State
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [admitCardData, setAdmitCardData] = useState(null);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // 1. Fetch available classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/api/students/classes');
        const clsList = res.data || [];
        setClasses(clsList);
        if (clsList.length > 0 && !formClass) {
          const defaultClass = clsList[0];
          setFormClass(defaultClass);
          loadDefaultSubjectsForClass(defaultClass);
        }
      } catch (e) {
        console.error('Failed to fetch classes', e);
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch existing exam schedules
  useEffect(() => {
    fetchSchedules();
  }, [activeTab, selectedAcademicYear]);

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/api/admit-cards/schedules?academic_year=${encodeURIComponent(selectedAcademicYear)}`);
      setSchedules(res.data || []);
    } catch (e) {
      console.error('Failed to fetch schedules', e);
    }
  };

  // Helper to load default subjects for a given class
  const loadDefaultSubjectsForClass = (clsName) => {
    const defaultList = getSubjectsForClass(clsName);
    setSubjectRows(defaultList.map(s => emptySubjectRow(s)));
  };

  // When admin changes class dropdown:
  const handleClassChange = (newClass) => {
    setFormClass(newClass);
    // Check if user has entered dates on any row
    const hasEnteredData = subjectRows.some(r => r.exam_date || r.room_no);
    if (!hasEnteredData) {
      // Auto-update subjects based on grade (e.g. removes Sanskrit for Class 9/10)
      loadDefaultSubjectsForClass(newClass);
    }
  };

  // ──── SUBJECT ROW CONTROLS ────

  const addSubjectRow = (subjName = '') => {
    setSubjectRows(prev => [...prev, emptySubjectRow(subjName)]);
  };

  const removeSubjectRow = (idx) => {
    if (subjectRows.length <= 1) return;
    setSubjectRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSubjectRow = (idx, field, value) => {
    setSubjectRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  // Apply start/end time or date to all rows at once
  const applyTimeToAll = (field, value) => {
    if (!value) return;
    setSubjectRows(prev => prev.map(r => ({ ...r, [field]: value })));
  };

  // ──── SAVE SCHEDULE ────

  const saveSchedule = async () => {
    if (!formClass) return showMsg('Please select a class', 'error');
    
    // Validate rows
    const validSubjects = subjectRows.filter(s => s.subject && s.subject.trim());
    if (validSubjects.length === 0) return showMsg('Please enter at least one subject', 'error');

    const missingDates = validSubjects.filter(s => !s.exam_date);
    if (missingDates.length > 0) {
      return showMsg(`Please enter an exam date for "${missingDates[0].subject}"`, 'error');
    }

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
      showMsg('Exam schedule saved successfully! You can now preview and print admit cards.', 'success');
      fetchSchedules();
    } catch (e) {
      showMsg(e.message || 'Failed to save schedule. Check database connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──── EDIT / DELETE SCHEDULE ────

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
      showMsg(`Loaded exam schedule for ${data.class_name} (${data.exam_type})`, 'success');
    } catch (e) {
      showMsg('Failed to load schedule for editing', 'error');
    }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam schedule?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admit-cards/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      showMsg('Exam schedule deleted successfully', 'success');
      fetchSchedules();
      if (selectedScheduleId === String(id)) {
        setSelectedScheduleId('');
        setAdmitCardData(null);
      }
    } catch (e) {
      showMsg('Failed to delete schedule', 'error');
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
        showMsg('No students found registered under this class.', 'warning');
      }
    } catch (e) {
      showMsg(e.message || 'Failed to generate admit cards', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = admitCardData?.students?.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.adm_no?.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  const tabs = [
    { id: 'create', label: '📝 1. Create Exam Schedule', icon: Calendar },
    { id: 'preview', label: '👁️ 2. Preview & Print Single', icon: Eye },
    { id: 'bulk', label: '🖨️ 3. Bulk Print (Class-wise)', icon: Users },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 no-print-wrapper">
      {/* Datalist for fast subject auto-completion */}
      <datalist id="common-subjects-list">
        {ALL_COMMON_SUBJECTS.map((s, idx) => (
          <option key={idx} value={s} />
        ))}
      </datalist>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText size={22} />
            </div>
            Admit Card Generator
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Configure exam dates & subjects class-wise, then preview or batch-print admit cards.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1.5 w-fit border border-gray-200 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
          message.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <AlertCircle size={18} className="shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* ═══════════════ TAB 1: CREATE / EDIT SCHEDULE ═══════════════ */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Form Top Panel */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" />
              Step 1: Select Class & Exam Term
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Class</label>
                <select 
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium shadow-sm"
                  value={formClass} 
                  onChange={e => handleClassChange(e.target.value)}
                >
                  {classes.length === 0 && <option value="">Loading classes...</option>}
                  {classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 Switching class automatically suggests correct subjects (e.g. removes Sanskrit for Class 9/10).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Exam Type / Term</label>
                <select 
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium shadow-sm"
                  value={formExamType} 
                  onChange={e => setFormExamType(e.target.value)}
                >
                  {EXAM_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Academic Year</label>
                <input 
                  type="text" 
                  readOnly 
                  value={selectedAcademicYear} 
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-600 font-semibold cursor-not-allowed shadow-sm" 
                />
              </div>
            </div>
          </div>

          {/* Subject Table Editor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                  <BookOpen size={18} className="text-indigo-600" />
                  Step 2: Exam Timetable & Subjects ({formClass || 'Select Class'})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set exam date and time for each subject. Add, remove, or rename subjects as needed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => loadDefaultSubjectsForClass(formClass)} 
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200"
                  title="Reset subjects to default recommendations for this class"
                >
                  <Sparkles size={13} />
                  Reset to {formClass || 'Class'} Subjects
                </button>
                <button 
                  type="button"
                  onClick={() => addSubjectRow()} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Add Row
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100/70 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="p-3.5 text-center font-bold w-12 text-xs">S.N</th>
                    <th className="p-3.5 text-left font-bold text-xs min-w-[200px]">Subject Name</th>
                    <th className="p-3.5 text-center font-bold text-xs w-44">Exam Date</th>
                    <th className="p-3.5 text-center font-bold text-xs w-36">Start Time</th>
                    <th className="p-3.5 text-center font-bold text-xs w-36">End Time</th>
                    <th className="p-3.5 text-center font-bold text-xs w-28">Room No</th>
                    <th className="p-3.5 text-center font-bold text-xs w-14"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjectRows.map((row, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-3 text-center text-gray-400 font-mono text-xs font-bold">{i + 1}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          list="common-subjects-list"
                          value={row.subject}
                          onChange={e => updateSubjectRow(i, 'subject', e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-xs"
                          placeholder="e.g. Science, Maths, Hindi"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          value={row.exam_date}
                          onChange={e => updateSubjectRow(i, 'exam_date', e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-xs font-medium"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.start_time}
                          onChange={e => updateSubjectRow(i, 'start_time', e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-xs font-medium"
                          placeholder="08:30 AM"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.end_time}
                          onChange={e => updateSubjectRow(i, 'end_time', e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-xs font-medium"
                          placeholder="12:30 PM"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.room_no}
                          onChange={e => updateSubjectRow(i, 'room_no', e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-xs font-medium"
                          placeholder="—"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          type="button"
                          onClick={() => removeSubjectRow(i)} 
                          className="text-gray-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                          title="Remove this subject row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Notes (English & Hindi) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
              Step 3: Footer Notes & Announcements (Printed on Admit Cards)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Note (English)</label>
                <textarea
                  value={formNoteEn}
                  onChange={e => setFormNoteEn(e.target.value)}
                  rows={3}
                  className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none shadow-xs"
                  placeholder="Enter English note..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Note (Hindi / नोट)</label>
                <textarea
                  value={formNoteHi}
                  onChange={e => setFormNoteHi(e.target.value)}
                  rows={3}
                  className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none shadow-xs"
                  placeholder="हिंदी नोट यहाँ लिखें..."
                />
              </div>
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="flex justify-end pt-2">
            <button 
              type="button"
              onClick={saveSchedule} 
              disabled={saving} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Save size={18} />
              {saving ? 'Saving Exam Schedule...' : 'Save Exam Schedule'}
            </button>
          </div>

          {/* Existing Saved Schedules Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8">
            <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm">
                Saved Exam Schedules ({selectedAcademicYear})
              </h3>
              <button 
                onClick={fetchSchedules} 
                className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-800"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <SchedulesList
              schedules={schedules}
              onEdit={loadScheduleForEdit}
              onDelete={deleteSchedule}
              onView={(id) => {
                setSelectedScheduleId(id);
                generateCards(id);
                setActiveTab('preview');
              }}
              fetchSchedules={fetchSchedules}
            />
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 2: PREVIEW & PRINT SINGLE ═══════════════ */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Select Schedule Picker */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[260px]">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Select Class Exam Schedule</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium shadow-sm"
                value={selectedScheduleId}
                onChange={e => {
                  setSelectedScheduleId(e.target.value);
                  if (e.target.value) generateCards(e.target.value);
                }}
              >
                <option value="">— Select an Exam Schedule —</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.class_name} — {s.exam_type} ({s.academic_year}) [{s.subject_count} subjects]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {generating && (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-3"></div>
              <p className="font-semibold text-sm">Generating admit cards from database...</p>
            </div>
          )}

          {admitCardData && admitCardData.students.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student list (left sidebar) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-1 flex flex-col h-[650px]">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <p className="font-bold text-gray-800 text-sm">{admitCardData.total_students} Students in {admitCardData.schedule.class_name}</p>
                  <div className="mt-2.5 relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search by name or Adm No..."
                      className="border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {filteredStudents.map((student, idx) => {
                    const actualIdx = admitCardData.students.indexOf(student);
                    const isSelected = selectedStudentIdx === actualIdx;
                    return (
                      <div
                        key={student.adm_no}
                        onClick={() => setSelectedStudentIdx(actualIdx)}
                        className={`px-4 py-3 cursor-pointer transition-colors text-sm ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-600 font-semibold'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate">{student.name}</span>
                          <span className="text-xs text-gray-400 font-mono">Adm: {student.adm_no}</span>
                        </div>
                        {student.father_name && (
                          <div className="text-xs text-gray-400 mt-0.5">S/O {student.father_name}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Preview (right panel) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500">
                    Viewing: <strong className="text-gray-900">{admitCardData.students[selectedStudentIdx]?.name}</strong>
                  </div>
                  <button 
                    onClick={handlePrint} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <Printer size={16} />
                    Print Single Admit Card
                  </button>
                </div>

                <div id="print-area-single" className="print-area bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
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
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <Users size={48} className="mx-auto mb-3 opacity-30 text-gray-500" />
              <p className="text-base font-bold text-gray-700">No students found in {admitCardData.schedule.class_name}</p>
              <p className="text-xs text-gray-400 mt-1">Please import or register students for this class first.</p>
            </div>
          )}

          {!selectedScheduleId && !generating && (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <Eye size={48} className="mx-auto mb-3 opacity-30 text-gray-500" />
              <p className="text-base font-bold text-gray-700">Select an exam schedule above to preview admit cards.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 3: BULK PRINT (CLASS-WISE) ═══════════════ */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* Schedule Selector */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex flex-wrap gap-4 items-end justify-between">
            <div className="flex-1 min-w-[260px]">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Select Class Schedule for Bulk Print</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium shadow-sm"
                value={selectedScheduleId}
                onChange={e => {
                  setSelectedScheduleId(e.target.value);
                  if (e.target.value) generateCards(e.target.value);
                }}
              >
                <option value="">— Select an Exam Schedule —</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.class_name} — {s.exam_type} ({s.academic_year}) [{s.subject_count} subjects]
                  </option>
                ))}
              </select>
            </div>

            {admitCardData && admitCardData.students.length > 0 && (
              <button 
                onClick={handlePrint} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Printer size={18} />
                Print All ({admitCardData.total_students} Cards)
              </button>
            )}
          </div>

          {generating && (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-3"></div>
              <p className="font-semibold text-sm">Formatting bulk admit cards for A4 paper print...</p>
            </div>
          )}

          {admitCardData && admitCardData.students.length > 0 && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Ready to print {admitCardData.total_students} admit cards for {admitCardData.schedule.class_name} ({admitCardData.schedule.exam_type})
                </div>
                <span className="text-xs text-emerald-700 font-normal">Arranged 2 cards per page (A4 layout)</span>
              </div>

              {/* Bulk Cards Grid */}
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

          {!selectedScheduleId && !generating && (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <Printer size={48} className="mx-auto mb-3 opacity-30 text-gray-500" />
              <p className="text-base font-bold text-gray-700">Select an exam schedule above to generate all admit cards.</p>
              <p className="text-xs text-gray-400 mt-1">Cards will be automatically paginated (2 cards per A4 page).</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ PRINT STYLES ═══════════════ */}
      <style>{`
        @media print {
          /* Hide non-printable app UI */
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

          /* 2 Cards Per Page Grid */
          .admit-card-bulk-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            padding: 2px !important;
          }
          .admit-card-template {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }

          @page {
            margin: 6mm;
            size: A4 portrait;
          }
        }

        /* Screen Preview for Bulk */
        .admit-card-bulk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .admit-card-bulk-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Saved Schedules List Component
// ─────────────────────────────────────────────────────────────
const SchedulesList = ({ schedules, onEdit, onDelete, onView, fetchSchedules }) => {
  if (schedules.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No exam schedules saved yet. Fill out the form above and click <strong>Save Exam Schedule</strong>.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {schedules.map(s => (
        <div key={s.id} className="p-4 flex flex-wrap justify-between items-center hover:bg-gray-50/70 transition-colors gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{s.class_name}</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {s.exam_type}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {s.subject_count} subjects &bull; Academic Year: {s.academic_year}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => onView(s.id)} 
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Generate Cards
            </button>
            <button 
              type="button"
              onClick={() => onEdit(s.id)} 
              className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Edit
            </button>
            <button 
              type="button"
              onClick={() => onDelete(s.id)} 
              className="text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdmitCard;
