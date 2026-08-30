import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Trash2, Save, Printer, Eye, Users, 
  Calendar, BookOpen, AlertCircle, RefreshCw, Search,
  CheckCircle, Sparkles, ChevronLeft, ChevronRight, Upload, Camera, Image
} from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const EXAM_TYPES = ['HALF YEARLY', 'ANNUAL', 'PT1', 'PT2', 'PRE-BOARD', 'UNIT TEST'];

// Class-specific subject presets
const CLASS_SUBJECT_PRESETS = {
  pre_primary: ['English', 'Hindi', 'Mathematics', 'General Knowledge', 'Drawing & Art', 'Rhymes & Oral'],
  primary: ['Hindi', 'English', 'Maths', 'Sanskrit', 'General Knowledge', 'Science', 'Computer', 'SST'],
  middle: ['Hindi', 'English', 'Maths', 'Sanskrit', 'Science', 'Social Science', 'Computer'],
  secondary: ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Information Technology', 'Physical Education'],
  senior_science: ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Physical Education', 'Computer Science'],
  senior_commerce: ['English', 'Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Physical Education'],
};

const ALL_COMMON_SUBJECTS = [
  'Hindi', 'English', 'Mathematics', 'Maths', 'Science', 'Social Science', 'SST',
  'Sanskrit', 'Computer', 'Information Technology', 'General Knowledge', 'GK',
  'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Business Studies', 'Economics',
  'History', 'Geography', 'Political Science', 'Physical Education', 'Art / Drawing',
  'Environmental Studies (EVS)', 'Moral Science', 'Music'
];

export const getSubjectsForClass = (className) => {
  if (!className) return CLASS_SUBJECT_PRESETS.primary;
  const raw = className.toString().trim().toUpperCase();
  const clean = raw.replace(/\s+/g, '');

  if (['NUR', 'LKG', 'UKG', 'PREP', 'PLAY', 'KG'].some(k => clean.includes(k))) {
    return CLASS_SUBJECT_PRESETS.pre_primary;
  }

  if (/\b(XII|12TH|12)\b/.test(raw) || clean.includes('12') || clean.includes('XII')) {
    return CLASS_SUBJECT_PRESETS.senior_science;
  }
  if (/\b(XI|11TH|11)\b/.test(raw) || clean.includes('11') || clean.includes('XI')) {
    return CLASS_SUBJECT_PRESETS.senior_science;
  }
  if (/\b(X|10TH|10)\b/.test(raw) || clean.includes('10') || clean === 'X' || clean.startsWith('X-') || clean.startsWith('X_')) {
    return CLASS_SUBJECT_PRESETS.secondary;
  }
  if (/\b(IX|9TH|9)\b/.test(raw) || clean.includes('9') || clean === 'IX' || clean.startsWith('IX-') || clean.startsWith('IX_')) {
    return CLASS_SUBJECT_PRESETS.secondary;
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

  const numMatch = clean.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (num >= 11) return CLASS_SUBJECT_PRESETS.senior_science;
    if (num >= 9) return CLASS_SUBJECT_PRESETS.secondary;
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

/**
 * Strict Half-A4 Isolated Print Engine
 * Enforces exact height limits so each admit card takes strictly half of an A4 paper (max 136mm height).
 */
const printElementContent = (elementId, docTitle = 'Admit Card') => {
  const contentElem = document.getElementById(elementId);
  if (!contentElem) {
    window.print();
    return;
  }

  let iframe = document.getElementById('admit-card-print-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'admit-card-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow || iframe.contentDocument;
  const doc = iframeDoc.document || iframeDoc;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #fff;
            color: #000;
          }
          @page {
            size: A4 portrait;
            margin: 5mm 6mm;
          }
          /* STRICT HALF-A4 HEIGHT LIMIT (Max 136mm) */
          .admit-card-template {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #fff !important;
            max-height: 136mm !important;
            height: auto !important;
            overflow: hidden !important;
            margin: 0 auto 5mm auto !important;
          }
          /* Bulk mode: exactly 2 cards stack vertically on 1 A4 page */
          .admit-card-bulk-grid {
            display: block !important;
          }
          .admit-card-bulk-grid .admit-card-template:nth-child(2n) {
            margin-bottom: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000 !important;
          }
          img {
            max-width: 100%;
            display: block;
          }
          @media print {
            body { padding: 0 !important; }
          }
        </style>
      </head>
      <body>
        ${contentElem.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print iframe error, falling back to window.print()', e);
      window.print();
    }
  }, 400);
};

// ─────────────────────────────────────────────────────────────
// Single Admit Card Template Component (Strict Half-A4 Format)
// ─────────────────────────────────────────────────────────────
const AdmitCardTemplate = ({ student, schedule, compact = false, onUploadPhotoClick }) => {
  if (!student || !schedule) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
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

  const acadYear = schedule.academic_year || '2026-2027';

  // Strict Half-A4 sizing styles
  const cardStyle = {
    fontSize: compact ? '8px' : '9.5px',
    padding: compact ? '6px 10px' : '10px 16px',
    border: '2px solid #000',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    marginBottom: compact ? '4mm' : '12px',
    background: '#fff',
    color: '#000',
    maxWidth: '680px',
    margin: '0 auto',
    boxSizing: 'border-box'
  };

  // Resolve student photo url (handles relative URLs or API uploads)
  const getFullPhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const studentPhotoUrl = getFullPhotoUrl(student.photo_url);

  return (
    <div style={cardStyle} className="admit-card-template shadow-xs">
      
      {/* ── TOP HEADER (Left: Building Photo | Center: Info | Right: Logo Emblem) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1.5px solid #000',
        paddingBottom: compact ? '3px' : '6px',
        marginBottom: compact ? '4px' : '8px',
        gap: compact ? '6px' : '10px',
      }}>
        
        {/* TOP LEFT: School Building Photo */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <img 
            src="/new_building.jpg" 
            alt="School Building"
            onError={(e) => { e.target.src = '/building.jpeg'; }}
            style={{
              width: compact ? '48px' : '64px',
              height: compact ? '36px' : '48px',
              objectFit: 'cover',
              border: '1px solid #333',
              borderRadius: '2px'
            }}
          />
        </div>

        {/* CENTER: School Full Information */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 2px' }}>
          <div style={{
            fontWeight: '900',
            fontSize: compact ? '11px' : '15px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            lineHeight: '1.15',
            fontFamily: 'Arial, sans-serif'
          }}>
            NEW SAINIK PUBLIC SCHOOL
          </div>
          
          <div style={{
            fontWeight: '600',
            fontSize: compact ? '6.5px' : '8.5px',
            color: '#111',
            marginTop: '1px',
            lineHeight: '1.2'
          }}>
            Siyarpakha, Gudha Kalan, Naraini, Banda, U.P. – 210129
          </div>

          <div style={{
            fontWeight: '600',
            fontSize: compact ? '6px' : '8px',
            color: '#222',
            marginTop: '0.5px',
            lineHeight: '1.2'
          }}>
            📞 7887299111, 9198343345
          </div>

          <div style={{
            fontWeight: '700',
            fontSize: compact ? '5.5px' : '7.5px',
            color: '#333',
            marginTop: '0.5px',
          }}>
            Affiliation: EJ-6/18-19 &bull; UDISE: 09400405918 &bull; Acad. Year: {acadYear}
          </div>

          <div style={{
            fontWeight: '800',
            fontSize: compact ? '7.5px' : '10px',
            marginTop: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px'
          }}>
            {schedule.exam_type} EXAMINATION ({acadYear})
          </div>

          <div style={{
            fontWeight: '900',
            fontSize: compact ? '8px' : '10.5px',
            textDecoration: 'underline',
            letterSpacing: '0.8px',
            marginTop: '1px'
          }}>
            ADMIT CARD
          </div>
        </div>

        {/* TOP RIGHT: School Logo Emblem */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <img 
            src="/new_logo.jpg" 
            alt="School Logo"
            onError={(e) => { e.target.src = '/logo.jpg'; }}
            style={{
              width: compact ? '42px' : '56px',
              height: compact ? '42px' : '56px',
              objectFit: 'contain',
              borderRadius: '50%'
            }}
          />
        </div>
      </div>

      {/* ── STUDENT DETAILS & PHOTO ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: compact ? '4px' : '7px',
        gap: '8px'
      }}>
        <div style={{ flex: 1, lineHeight: compact ? '1.3' : '1.5' }}>
          <div style={{ display: 'flex', gap: compact ? '10px' : '20px', marginBottom: '1.5px', flexWrap: 'wrap' }}>
            <div><strong>Name</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.name || '—'}</div>
            <div><strong>Class</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.class_name || schedule.class_name || '—'}{student.section ? ` ${student.section}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: compact ? '10px' : '20px', marginBottom: '1.5px', flexWrap: 'wrap' }}>
            <div><strong>Father's Name</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.father_name || '—'}</div>
            <div><strong>Roll No.</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.adm_no || '—'}</div>
          </div>
          <div>
            <strong>Admission No.</strong>&nbsp;&nbsp;:&nbsp;&nbsp;{student.adm_no || '—'}
          </div>
        </div>

        {/* Student Photo Box (Prints actual student photo or Affix box) */}
        <div 
          onClick={onUploadPhotoClick}
          className={onUploadPhotoClick ? "cursor-pointer group relative" : ""}
          style={{
            width: compact ? '36px' : '50px',
            height: compact ? '44px' : '60px',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: '#fafafa',
            overflow: 'hidden'
          }}
          title={onUploadPhotoClick ? "Click to upload/change student photo" : ""}
        >
          {studentPhotoUrl ? (
            <img 
              src={studentPhotoUrl} 
              alt={student.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              fontSize: compact ? '6.5px' : '8.5px',
              color: '#555',
              fontWeight: '600',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              Affix<br />Photo
            </div>
          )}

          {/* Interactive upload indicator in preview mode */}
          {onUploadPhotoClick && (
            <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-semibold text-center p-0.5">
              📷 Upload
            </div>
          )}
        </div>
      </div>

      {/* ── EXAM TIMETABLE TABLE (Compact Height) ── */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: compact ? '4px' : '7px',
        fontSize: compact ? '7px' : '9px',
      }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={thStyle(compact, '26px')}>S.N</th>
            <th style={thStyle(compact, '72px')}>Date</th>
            <th style={{ ...thStyle(compact), textAlign: 'left' }}>Subject</th>
            <th style={thStyle(compact, '64px')}>Start Time</th>
            <th style={thStyle(compact, '64px')}>End Time</th>
            <th style={thStyle(compact, '50px')}>Room No</th>
            <th style={thStyle(compact, '58px')}>Inv. Sign</th>
          </tr>
        </thead>
        <tbody>
          {(schedule.subjects || []).map((sub, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle(compact), textAlign: 'center', fontWeight: 'bold' }}>{sub.serial_no || i + 1}</td>
              <td style={{ ...tdStyle(compact), textAlign: 'center' }}>{formatDate(sub.exam_date)}</td>
              <td style={{ ...tdStyle(compact), textAlign: 'left', fontWeight: '700' }}>{sub.subject}</td>
              <td style={{ ...tdStyle(compact), textAlign: 'center' }}>{sub.start_time}</td>
              <td style={{ ...tdStyle(compact), textAlign: 'center' }}>{sub.end_time}</td>
              <td style={{ ...tdStyle(compact), textAlign: 'center' }}>{sub.room_no || '—'}</td>
              <td style={tdStyle(compact)}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── SIGNATURES ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: compact ? '6px' : '14px',
        marginBottom: compact ? '4px' : '6px',
        fontWeight: '700',
        fontSize: compact ? '7.5px' : '9.5px',
      }}>
        <div>
          <div style={{ borderTop: '1px solid #000', width: compact ? '75px' : '110px', marginBottom: '2px' }}></div>
          Sign. Class Teacher
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ borderTop: '1px solid #000', width: compact ? '75px' : '110px', marginBottom: '2px', marginLeft: 'auto' }}></div>
          Sign. Principal
        </div>
      </div>

      {/* ── FOOTER NOTES ── */}
      {(schedule.note_english || schedule.note_hindi) && (
        <div style={{
          fontSize: compact ? '6px' : '8px',
          color: '#222',
          borderTop: '1px solid #ccc',
          paddingTop: compact ? '2px' : '4px',
          lineHeight: '1.25',
        }}>
          {schedule.note_english && <div><strong>Note:</strong> {schedule.note_english}</div>}
          {schedule.note_hindi && <div style={{ marginTop: '1px' }}><strong>नोट :</strong> {schedule.note_hindi}</div>}
        </div>
      )}
    </div>
  );
};

const thStyle = (compact, width = 'auto') => ({
  border: '1px solid #000',
  padding: compact ? '1.5px 3px' : '3.5px 5px',
  fontWeight: '800',
  textAlign: 'center',
  fontSize: compact ? '6.5px' : '8.5px',
  width: width,
});

const tdStyle = (compact) => ({
  border: '1px solid #000',
  padding: compact ? '1.5px 3px' : '3px 5px',
  fontSize: compact ? '7px' : '9px',
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

  // Form State
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef(null);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

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

  const loadDefaultSubjectsForClass = (clsName) => {
    const defaultList = getSubjectsForClass(clsName);
    setSubjectRows(defaultList.map(s => emptySubjectRow(s)));
  };

  const handleClassChange = (newClass) => {
    setFormClass(newClass);
    const hasEnteredData = subjectRows.some(r => r.exam_date || r.room_no);
    if (!hasEnteredData) {
      loadDefaultSubjectsForClass(newClass);
    }
  };

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

  const saveSchedule = async () => {
    if (!formClass) return showMsg('Please select a class', 'error');
    
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
      showMsg(e.message || 'Failed to save schedule', 'error');
    } finally {
      setSaving(false);
    }
  };

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

  // ──── STUDENT PHOTO UPLOAD HANDLER ────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentStudent = admitCardData?.students?.[selectedStudentIdx];
    if (!currentStudent) return;

    const formData = new FormData();
    formData.append('photo', file);

    setUploadingPhoto(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/students/${currentStudent.adm_no}/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Photo upload failed');

      // Update state immediately
      setAdmitCardData(prev => {
        if (!prev) return prev;
        const updatedStudents = [...prev.students];
        updatedStudents[selectedStudentIdx] = {
          ...updatedStudents[selectedStudentIdx],
          photo_url: data.data.photo_url
        };
        return { ...prev, students: updatedStudents };
      });

      showMsg(`Photo uploaded for ${currentStudent.name}!`, 'success');
    } catch (err) {
      showMsg(err.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePrintSingle = () => {
    const currentStudent = admitCardData?.students?.[selectedStudentIdx];
    const studentName = currentStudent ? currentStudent.name : 'Student';
    printElementContent('print-area-single', `Admit Card - ${studentName}`);
  };

  const handlePrintBulk = () => {
    const className = admitCardData?.schedule?.class_name || 'Class';
    printElementContent('print-area-bulk', `Admit Cards - ${className}`);
  };

  const filteredStudents = admitCardData?.students?.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.adm_no?.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  const tabs = [
    { id: 'create', label: '📝 1. Create Exam Schedule', icon: Calendar },
    { id: 'preview', label: '👁️ 2. Preview & Print Single', icon: Eye },
    { id: 'bulk', label: '🖨️ 3. Bulk Print (2 per A4)', icon: Users },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 no-print-wrapper">
      <datalist id="common-subjects-list">
        {ALL_COMMON_SUBJECTS.map((s, idx) => (
          <option key={idx} value={s} />
        ))}
      </datalist>

      {/* Hidden File Input for Quick Student Photo Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />

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
            Generate official admit cards with student photo & school letterhead (Half-A4 / 2 cards per A4 page).
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1.5 w-fit border border-gray-200 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
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
                  Set exam date and time for each subject. Cards strictly fit half of A4.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => loadDefaultSubjectsForClass(formClass)} 
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200 cursor-pointer"
                >
                  <Sparkles size={13} />
                  Reset to {formClass || 'Class'} Subjects
                </button>
                <button 
                  type="button"
                  onClick={() => addSubjectRow()} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
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
                          className="text-gray-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
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

          {/* Footer Notes */}
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

          {/* Existing Saved Schedules */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8">
            <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm">
                Saved Exam Schedules ({selectedAcademicYear})
              </h3>
              <button 
                onClick={fetchSchedules} 
                className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-800 cursor-pointer"
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
              {/* Student List (Left Sidebar) */}
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
                          <span className="truncate flex items-center gap-1.5">
                            {student.photo_url && <span className="text-emerald-600 text-xs font-bold">●</span>}
                            {student.name}
                          </span>
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

              {/* Card Preview (Right Panel) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={selectedStudentIdx <= 0}
                      onClick={() => setSelectedStudentIdx(prev => Math.max(0, prev - 1))}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer text-gray-700"
                      title="Previous Student"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-semibold text-gray-700">
                      Student {selectedStudentIdx + 1} of {admitCardData.total_students}
                    </span>
                    <button
                      disabled={selectedStudentIdx >= admitCardData.total_students - 1}
                      onClick={() => setSelectedStudentIdx(prev => Math.min(admitCardData.total_students - 1, prev + 1))}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer text-gray-700"
                      title="Next Student"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-gray-300 cursor-pointer"
                      title="Upload or change student photo"
                    >
                      <Camera size={15} />
                      {uploadingPhoto ? 'Uploading...' : 'Upload Student Photo'}
                    </button>

                    <button 
                      type="button"
                      onClick={handlePrintSingle} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <Printer size={16} />
                      Print Single (Half A4)
                    </button>
                  </div>
                </div>

                <div id="print-area-single" className="print-area bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <AdmitCardTemplate
                    student={admitCardData.students[selectedStudentIdx]}
                    schedule={admitCardData.schedule}
                    onUploadPhotoClick={() => fileInputRef.current?.click()}
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

      {/* ═══════════════ TAB 3: BULK PRINT (2 CARDS PER A4 PAGE) ═══════════════ */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
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
                type="button"
                onClick={handlePrintBulk} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Printer size={18} />
                Print All ({admitCardData.total_students} Cards &bull; 2 per A4)
              </button>
            )}
          </div>

          {generating && (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-3"></div>
              <p className="font-semibold text-sm">Formatting bulk admit cards (2 cards per A4 sheet)...</p>
            </div>
          )}

          {admitCardData && admitCardData.students.length > 0 && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Ready to print {admitCardData.total_students} admit cards for {admitCardData.schedule.class_name} ({admitCardData.schedule.exam_type})
                </div>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                  Strictly 2 cards per A4 page ({Math.ceil(admitCardData.total_students / 2)} sheets total)
                </span>
              </div>

              <div id="print-area-bulk" className="print-area">
                <div className="admit-card-bulk-grid">
                  {admitCardData.students.map((student, idx) => (
                    <AdmitCardTemplate
                      key={student.adm_no}
                      student={student}
                      schedule={admitCardData.schedule}
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
              <p className="text-xs text-gray-400 mt-1">Cards are strictly sized to half an A4 sheet (2 students per page).</p>
            </div>
          )}
        </div>
      )}
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
