import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Database, Upload, Download, FileText, Users, IndianRupee,
  AlertCircle, CheckCircle, Loader2, FileDown, ChevronDown,
  CloudUpload, Table2, ArrowDownToLine, Sparkles, TriangleAlert,
  Camera, Image, RefreshCw, Check, X, Search, Filter
} from 'lucide-react';
import api from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const academic_years = ['2026-2027', '2025-2026', '2024-2025', '2023-2024'];

const StatusBadge = ({ type, children }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    error:   'bg-rose-50 text-rose-700 border border-rose-200',
    info:    'bg-indigo-50 text-indigo-700 border border-indigo-200',
  };
  const icons = {
    success: <CheckCircle size={14} className="shrink-0" />,
    error:   <AlertCircle size={14} className="shrink-0" />,
    info:    <Sparkles size={14} className="shrink-0" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
      {icons[type]}{children}
    </span>
  );
};

// ─── Drop-zone component for CSV/Excel ────────────────────────────────────────
const DropZone = ({ onFile, accept = '.csv,.xlsx,.xls', label }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelected(file); onFile(file); }
  }, [onFile]);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelected(file); onFile(file); }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8
        flex flex-col items-center justify-center gap-3 text-center select-none
        ${dragging
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01] shadow-lg shadow-indigo-100'
          : selected
            ? 'border-emerald-400 bg-emerald-50/50'
            : 'border-gray-200 bg-gray-50/60 hover:border-indigo-300 hover:bg-indigo-50/30'
        }
      `}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
        ${selected ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
        {selected ? <CheckCircle size={28} /> : <CloudUpload size={28} />}
      </div>
      {selected ? (
        <>
          <p className="font-semibold text-emerald-700">{selected.name}</p>
          <p className="text-xs text-gray-500">{(selected.size / 1024).toFixed(1)} KB — Click to change</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-gray-700">{label}</p>
          <p className="text-sm text-gray-400">Drag & drop here, or click to browse</p>
          <StatusBadge type="info">CSV or Excel (.xlsx) accepted</StatusBadge>
        </>
      )}
    </div>
  );
};

// ─── Multi-Photo Drop Zone ──────────────────────────────────────────────────
const MultiPhotoDropZone = ({ onFilesSelected, uploading }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8
        flex flex-col items-center justify-center gap-3 text-center select-none
        ${dragging
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01] shadow-lg shadow-indigo-100'
          : 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 hover:bg-indigo-50/70'
        }
      `}
    >
      <input 
        ref={inputRef} 
        type="file" 
        multiple 
        accept="image/*" 
        className="hidden" 
        onChange={handleChange} 
      />
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
        {uploading ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
      </div>
      <div>
        <p className="font-bold text-gray-800 text-base">
          {uploading ? 'Uploading and Matching Photos...' : 'Drop Student Photos Here (Multiple Files)'}
        </p>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Name photos with student <strong>Registration/Admission No.</strong> (e.g. <code className="bg-indigo-100/70 text-indigo-800 px-1 py-0.5 rounded font-mono font-bold">415Ns.jpg</code>, <code className="bg-indigo-100/70 text-indigo-800 px-1 py-0.5 rounded font-mono font-bold">509Ns.png</code>).
        </p>
      </div>
      <div className="flex gap-2 items-center text-xs text-indigo-600 font-semibold bg-white/80 px-3 py-1.5 rounded-full border border-indigo-100">
        <Sparkles size={14} /> Select 50+ photos at once — matches automatically!
      </div>
    </div>
  );
};

// ─── Export Card ──────────────────────────────────────────────────────────────
const ExportCard = ({ icon: Icon, title, description, color, onDownload, loading, extraContent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col gap-4">
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    {extraContent}
    <button
      id={`export-btn-${title.replace(/\s/g, '-').toLowerCase()}`}
      onClick={onDownload}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold
        transition-all duration-200 border cursor-pointer
        ${loading
          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
          : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow-md hover:shadow-indigo-200 active:scale-95'
        }
      `}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
      {loading ? 'Preparing...' : 'Download CSV'}
    </button>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const DataManagement = () => {
  const [importTab, setImportTab] = useState('students'); // 'students' | 'fees' | 'photos'
  const [studentFile, setStudentFile] = useState(null);
  const [feeFile, setFeeFile] = useState(null);
  const [academicYear, setAcademicYear] = useState(academic_years[0]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Bulk Photo Upload State
  const [bulkPhotoResult, setBulkPhotoResult] = useState(null);
  const [uploadingBulkPhotos, setUploadingBulkPhotos] = useState(false);

  // Class-wise Photo Roster State
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [singleUploadingAdm, setSingleUploadingAdm] = useState(null);

  const singleFileInputRef = useRef(null);
  const [targetStudentForUpload, setTargetStudentForUpload] = useState(null);

  // Export state
  const [exportLoading, setExportLoading] = useState({});
  const [ledgerStart, setLedgerStart] = useState('');
  const [ledgerEnd, setLedgerEnd] = useState('');

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/api/students/classes');
        const list = res.data || [];
        setClasses(list);
        if (list.length > 0 && !selectedClass) {
          setSelectedClass(list[0]);
        }
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch class students whenever selectedClass changes
  useEffect(() => {
    if (!selectedClass) return;
    fetchClassStudents(selectedClass);
  }, [selectedClass]);

  const fetchClassStudents = async (className) => {
    setLoadingClassStudents(true);
    try {
      const res = await api.get(`/api/students/class/${encodeURIComponent(className)}/photos`);
      setClassStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load class students', err);
    } finally {
      setLoadingClassStudents(false);
    }
  };

  // ── Multi-photo Bulk Upload Handler ──────────────────────────────────────
  const handleBulkPhotos = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingBulkPhotos(true);
    setBulkPhotoResult(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/students/bulk-photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk upload failed');

      setBulkPhotoResult({
        type: data.data.matched.length > 0 ? 'success' : 'error',
        message: data.message,
        matched: data.data.matched,
        unmatched: data.data.unmatched
      });

      // Refresh class roster
      if (selectedClass) fetchClassStudents(selectedClass);
    } catch (err) {
      setBulkPhotoResult({
        type: 'error',
        message: err.message || 'Failed to upload photos.',
        matched: [],
        unmatched: []
      });
    } finally {
      setUploadingBulkPhotos(false);
    }
  };

  // ── Single Student Photo Upload in Roster ────────────────────────────────
  const triggerSingleUpload = (student) => {
    setTargetStudentForUpload(student);
    singleFileInputRef.current?.click();
  };

  const handleSinglePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !targetStudentForUpload) return;

    const admNo = targetStudentForUpload.adm_no;
    setSingleUploadingAdm(admNo);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/students/${admNo}/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Update local student in state
      setClassStudents(prev => prev.map(s => s.adm_no === admNo ? { ...s, photo_url: data.data.photo_url } : s));
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setSingleUploadingAdm(null);
      setTargetStudentForUpload(null);
      if (singleFileInputRef.current) singleFileInputRef.current.value = '';
    }
  };

  // ── CSV Import handlers ────────────────────────────────────────────────────
  const handleImport = async () => {
    const file = importTab === 'students' ? studentFile : feeFile;
    if (!file) { setImportResult({ type: 'error', message: 'Please select a CSV file first.' }); return; }

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('academicYear', academicYear);

    try {
      const endpoint = importTab === 'students' ? '/api/students/import' : '/api/fees/import';
      const res = await api.postForm(endpoint, formData);

      setImportResult({
        type: (res.errors?.length === 0) ? 'success' : (res.insertedCount > 0 ? 'partial' : 'error'),
        message: res.message || 'Import completed.',
        count: res.insertedCount,
        errors: res.errors || [],
      });
    } catch (err) {
      setImportResult({ type: 'error', message: err.message || 'Import failed. Please try again.' });
    } finally {
      setImporting(false);
    }
  };

  const handleTemplateDownload = async (type) => {
    const path = type === 'students' ? '/api/students/template' : '/api/fees/template';
    const name = type === 'students' ? 'student_import_template.csv' : 'fee_import_template.csv';
    try { await api.downloadBlob(path, name); } catch (e) { alert('Template download failed: ' + e.message); }
  };

  // ── Export handlers ────────────────────────────────────────────────────────
  const triggerExport = async (key, path, filename) => {
    setExportLoading(prev => ({ ...prev, [key]: true }));
    try {
      await api.downloadBlob(path, filename);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExportLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleExportStudents = () =>
    triggerExport('students', '/api/students/export', `students_export_${today}.csv`);

  const handleExportLedger = () => {
    const params = new URLSearchParams();
    if (ledgerStart) params.append('startDate', ledgerStart);
    if (ledgerEnd)   params.append('endDate', ledgerEnd);
    triggerExport('ledger', `/api/fees/export/ledger?${params.toString()}`, `fee_ledger_${today}.csv`);
  };

  const handleExportDefaulters = () =>
    triggerExport('defaulters', '/api/fees/export/defaulters', `defaulters_${today}.csv`);

  const filteredClassStudents = classStudents.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.adm_no?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const getFullPhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      {/* Hidden file input for single photo replacement in roster */}
      <input 
        type="file" 
        ref={singleFileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleSinglePhotoChange} 
      />

      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Database size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Data Management & Photos</h1>
          </div>
          <p className="text-gray-500 mt-1 ml-1">
            Import student data, feed photos in bulk by registration number/class, or export financial ledgers.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════
          IMPORT SECTION (WITH PHOTOS TAB)
      ════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Upload size={18} className="text-indigo-500" />
          <h2 className="text-xl font-bold text-gray-800">Import & Bulk Upload</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {[
              { key: 'students', label: 'Students (CSV)', icon: Users },
              { key: 'fees',     label: 'Fee Records (CSV)', icon: IndianRupee },
              { key: 'photos',   label: 'Student Photos (Bulk 📸)', icon: Camera },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  id={`import-tab-${tab.key}`}
                  onClick={() => { setImportTab(tab.key); setImportResult(null); }}
                  className={`
                    flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all border-b-2 cursor-pointer
                    ${importTab === tab.key
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-white/60'
                    }
                  `}
                >
                  <Icon size={16} />{tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6 space-y-6">
            
            {/* ── TAB 1 & 2: CSV / Excel Import ── */}
            {importTab !== 'photos' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-600">Academic Year:</label>
                    <div className="relative">
                      <select
                        id="academic-year-select"
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        className="appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm bg-white text-gray-800 outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                      >
                        {academic_years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    id={`download-template-${importTab}`}
                    onClick={() => handleTemplateDownload(importTab)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <FileDown size={15} />
                    Download {importTab === 'students' ? 'Student' : 'Fee'} Template
                  </button>
                </div>

                <DropZone
                  onFile={importTab === 'students' ? setStudentFile : setFeeFile}
                  label={importTab === 'students'
                    ? 'Drop your students CSV file here'
                    : 'Drop your fee records CSV file here'
                  }
                />

                <div className="bg-slate-50 rounded-xl p-4 text-xs text-gray-600 border border-slate-100">
                  <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Table2 size={14} className="text-indigo-500" />
                    Required columns:
                  </p>
                  {importTab === 'students' ? (
                    <code className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-gray-700 block">
                      adm_no, name, class_name
                    </code>
                  ) : (
                    <code className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-gray-700 block">
                      adm_no, total_amount, transport_fee, total_paid, concession, payment_mode, payment_date, transaction_id
                    </code>
                  )}
                  <p className="mt-2 text-gray-400">Column names are flexible — the importer auto-detects headers.</p>
                </div>

                <button
                  id="run-import-btn"
                  onClick={handleImport}
                  disabled={importing}
                  className={`
                    w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold
                    transition-all duration-200 shadow cursor-pointer
                    ${importing
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99]'
                    }
                  `}
                >
                  {importing
                    ? <><Loader2 size={18} className="animate-spin" /> Importing, please wait…</>
                    : <><Upload size={18} /> Start Import</>
                  }
                </button>

                {importResult && (
                  <div className={`rounded-xl p-4 border flex flex-col gap-3
                    ${importResult.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                      importResult.type === 'partial' ? 'bg-amber-50 border-amber-200' :
                      'bg-rose-50 border-rose-200'}`}>
                    <div className="flex items-center gap-2">
                      {importResult.type === 'success' && <CheckCircle size={18} className="text-emerald-600" />}
                      {importResult.type === 'partial' && <TriangleAlert size={18} className="text-amber-600" />}
                      {importResult.type === 'error'   && <AlertCircle size={18} className="text-rose-600" />}
                      <p className={`font-semibold text-sm
                        ${importResult.type === 'success' ? 'text-emerald-800' :
                          importResult.type === 'partial' ? 'text-amber-800' : 'text-rose-800'}`}>
                        {importResult.message}
                      </p>
                      {importResult.count !== undefined && (
                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 text-gray-700">
                          {importResult.count} records saved
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TAB 3: BULK STUDENT PHOTOS BY REGISTRATION NO / CLASS ── */}
            {importTab === 'photos' && (
              <div className="space-y-8">
                
                {/* Method 1: Bulk Multi-File Upload by Admission Number */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <Upload size={18} className="text-indigo-600" />
                        Method 1: Multi-Photo Drag & Drop (By Registration No.)
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Name image files as their Admission/Registration No. (e.g. <code>415Ns.jpg</code>, <code>509Ns.png</code>) and drop them all at once.
                      </p>
                    </div>
                  </div>

                  <MultiPhotoDropZone 
                    onFilesSelected={handleBulkPhotos} 
                    uploading={uploadingBulkPhotos} 
                  />

                  {/* Match results breakdown */}
                  {bulkPhotoResult && (
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      bulkPhotoResult.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">{bulkPhotoResult.message}</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white text-gray-800 border">
                          {bulkPhotoResult.matched.length} Matched / {bulkPhotoResult.unmatched.length} Unmatched
                        </span>
                      </div>

                      {bulkPhotoResult.unmatched.length > 0 && (
                        <div className="bg-white/80 p-3 rounded-lg border border-amber-300 text-xs space-y-1">
                          <p className="font-bold text-amber-900">Unmatched Files (Please check filename vs Admission Number):</p>
                          <div className="max-h-28 overflow-y-auto space-y-0.5 font-mono text-gray-700">
                            {bulkPhotoResult.unmatched.map((u, i) => (
                              <div key={i} className="text-[11px] flex justify-between">
                                <span>📁 {u.file}</span>
                                <span className="text-rose-600">{u.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Method 2: Class-wise Photo Roster & Gallery */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" />
                        Method 2: Class-Wise Student Photo Gallery
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Select a class to view all students, verify their photos, or upload for individual students.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
                      >
                        {classes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <div className="relative flex-1 sm:w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          placeholder="Search student..."
                          className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {loadingClassStudents ? (
                    <div className="text-center py-12 text-gray-400">
                      <Loader2 size={28} className="animate-spin mx-auto mb-2 text-indigo-600" />
                      <p className="text-xs font-semibold">Loading student photos for {selectedClass}...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {filteredClassStudents.map(student => {
                        const hasPhoto = !!student.photo_url;
                        const photoSrc = getFullPhotoUrl(student.photo_url);
                        const isUploading = singleUploadingAdm === student.adm_no;

                        return (
                          <div 
                            key={student.adm_no} 
                            className="bg-gray-50/70 border border-gray-200 rounded-xl p-3 flex flex-col items-center text-center relative group hover:border-indigo-300 hover:bg-indigo-50/20 transition-all shadow-2xs"
                          >
                            {/* Status Indicator */}
                            <div className="absolute top-2 right-2">
                              {hasPhoto ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow-xs" title="Photo Uploaded" />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block shadow-xs" title="Missing Photo" />
                              )}
                            </div>

                            {/* Photo Thumbnail */}
                            <div 
                              onClick={() => triggerSingleUpload(student)}
                              className="w-16 h-20 bg-white border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer group-hover:shadow-sm"
                            >
                              {isUploading ? (
                                <Loader2 size={20} className="animate-spin text-indigo-600" />
                              ) : hasPhoto ? (
                                <img 
                                  src={photoSrc} 
                                  alt={student.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="text-gray-400 flex flex-col items-center justify-center p-1">
                                  <Camera size={20} className="mb-0.5" />
                                  <span className="text-[9px] font-semibold text-gray-400">Add</span>
                                </div>
                              )}

                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">
                                {hasPhoto ? 'Change' : 'Upload'}
                              </div>
                            </div>

                            {/* Student Details */}
                            <p className="font-bold text-gray-900 text-xs mt-2 truncate w-full" title={student.name}>
                              {student.name}
                            </p>
                            <p className="text-[10px] font-mono text-gray-500">
                              Adm: {student.adm_no}
                            </p>

                            <button
                              type="button"
                              onClick={() => triggerSingleUpload(student)}
                              className="mt-2 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-gray-200 px-2 py-0.5 rounded-md w-full transition-colors cursor-pointer"
                            >
                              {hasPhoto ? 'Replace Photo' : 'Upload Photo'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filteredClassStudents.length === 0 && !loadingClassStudents && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-semibold">No students found in {selectedClass}.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          EXPORT SECTION
      ════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Download size={18} className="text-violet-500" />
          <h2 className="text-xl font-bold text-gray-800">Export Data</h2>
          <span className="ml-2 text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full">One-click downloads</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <ExportCard
            icon={Users}
            title="All Students"
            description="Export complete student list with fee structure (payable, paid, pending)"
            color="bg-blue-100 text-blue-600"
            loading={exportLoading.students}
            onDownload={handleExportStudents}
          />

          <ExportCard
            icon={IndianRupee}
            title="Fee Ledger"
            description="All fee collection records — filter by date range before downloading"
            color="bg-violet-100 text-violet-600"
            loading={exportLoading.ledger}
            onDownload={handleExportLedger}
            extraContent={
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">From</label>
                  <input
                    type="date" value={ledgerStart}
                    onChange={e => setLedgerStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input
                    type="date" value={ledgerEnd}
                    onChange={e => setLedgerEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              </div>
            }
          />

          <ExportCard
            icon={FileText}
            title="Fee Defaulters"
            description="All students with pending balance / unpaid dues for the current academic year"
            color="bg-rose-100 text-rose-600"
            loading={exportLoading.defaulters}
            onDownload={handleExportDefaulters}
          />
        </div>
      </section>
    </div>
  );
};

export default DataManagement;
