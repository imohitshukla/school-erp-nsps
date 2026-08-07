import React, { useState, useRef, useCallback } from 'react';
import {
  Database, Upload, Download, FileText, Users, IndianRupee,
  AlertCircle, CheckCircle, Loader2, FileDown, ChevronDown,
  CloudUpload, Table2, ArrowDownToLine, Sparkles, TriangleAlert
} from 'lucide-react';
import api from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const academic_years = ['2026-2027', '2025-2026', '2024-2025', '2023-2024'];

// ─── Sub-components ───────────────────────────────────────────────────────────
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

// ─── Drop-zone component ──────────────────────────────────────────────────────
const DropZone = ({ onFile, accept = '.csv', label }) => {
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
          <p className="text-sm text-gray-400">Drag & drop your CSV here, or click to browse</p>
          <StatusBadge type="info">Only CSV files accepted</StatusBadge>
        </>
      )}
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
        transition-all duration-200 border
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
  // — Import state
  const [importTab, setImportTab] = useState('students');
  const [studentFile, setStudentFile] = useState(null);
  const [feeFile, setFeeFile] = useState(null);
  const [academicYear, setAcademicYear] = useState(academic_years[0]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // — Export state
  const [exportLoading, setExportLoading] = useState({});
  const [ledgerStart, setLedgerStart] = useState('');
  const [ledgerEnd, setLedgerEnd] = useState('');

  // ── Import handlers ────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Database size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Data Management</h1>
          </div>
          <p className="text-gray-500 mt-1 ml-1">Import data into the database or export any dataset to CSV — anytime.</p>
        </div>
      </div>

      {/* ════════════════════════════════
          IMPORT SECTION
      ════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Upload size={18} className="text-indigo-500" />
          <h2 className="text-xl font-bold text-gray-800">Import Data</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {[
              { key: 'students', label: 'Students', icon: Users },
              { key: 'fees',     label: 'Fee Records', icon: IndianRupee },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  id={`import-tab-${tab.key}`}
                  onClick={() => { setImportTab(tab.key); setImportResult(null); }}
                  className={`
                    flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all border-b-2
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
            {/* Academic Year + Template */}
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <FileDown size={15} />
                Download {importTab === 'students' ? 'Student' : 'Fee'} Template
              </button>
            </div>

            {/* Drop-zone */}
            <DropZone
              onFile={importTab === 'students' ? setStudentFile : setFeeFile}
              label={importTab === 'students'
                ? 'Drop your students CSV file here'
                : 'Drop your fee records CSV file here'
              }
            />

            {/* Format guide */}
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-gray-600 border border-slate-100">
              <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Table2 size={14} className="text-indigo-500" />
                Required CSV columns:
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

            {/* Import button */}
            <button
              id="run-import-btn"
              onClick={handleImport}
              disabled={importing}
              className={`
                w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold
                transition-all duration-200 shadow
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

            {/* Result panel */}
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
                {importResult.errors?.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-rose-700 font-mono bg-rose-100/50 rounded px-2 py-1">{e}</p>
                    ))}
                  </div>
                )}
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
          {/* Students export */}
          <ExportCard
            icon={Users}
            title="All Students"
            description="Export complete student list with fee structure (payable, paid, pending)"
            color="bg-blue-100 text-blue-600"
            loading={exportLoading.students}
            onDownload={handleExportStudents}
          />

          {/* Fee Ledger export */}
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

          {/* Defaulters export */}
          <ExportCard
            icon={AlertCircle}
            title="Defaulters List"
            description="Students with pending fee balance — great for follow-up and reporting"
            color="bg-rose-100 text-rose-600"
            loading={exportLoading.defaulters}
            onDownload={handleExportDefaulters}
          />
        </div>

        {/* Template downloads */}
        <div className="mt-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FileText size={15} className="text-indigo-400" /> Import Templates
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              id="template-students-btn"
              onClick={() => handleTemplateDownload('students')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 font-medium hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
            >
              <FileDown size={15} className="text-indigo-500" /> Student Template CSV
            </button>
            <button
              id="template-fees-btn"
              onClick={() => handleTemplateDownload('fees')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 font-medium hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all shadow-sm"
            >
              <FileDown size={15} className="text-violet-500" /> Fee Records Template CSV
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Download a template, fill it in with your data, and upload it using the Import section above.
          </p>
        </div>
      </section>
    </div>
  );
};

export default DataManagement;
