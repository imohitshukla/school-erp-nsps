import React, { useState, useRef } from 'react';
import {
  User, Calendar, IndianRupee, CreditCard, FileText,
  CheckCircle, AlertCircle, Search, Loader2, Receipt,
} from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const MONTHS = [
  'April','May','June','July','August','September',
  'October','November','December','January','February','March',
];

const PAYMENT_MODES = ['Cash','UPI','Cheque','Bank Transfer','DD'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const initialForm = {
  admission_number: '',
  billing_month: '',
  payment_date: new Date().toISOString().split('T')[0],
  tuition_amount: '',
  transport_amount: '',
  payment_mode: 'Cash',
  receipt_no: '',
  notes: '',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManualFeeEntry() {
  const { selectedAcademicYear } = useAppContext();
  const [form, setForm] = useState(initialForm);

  // Student resolution state
  const [student, setStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Monthly dues for the resolved student
  const [monthlyDues, setMonthlyDues] = useState([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);   // { receipt_no, message }
  const [submitError, setSubmitError] = useState('');

  const admNoRef = useRef();

  // ── Compute totals ──────────────────────────────────────────────────────────
  const tuition   = parseFloat(form.tuition_amount   || 0) || 0;
  const transport = parseFloat(form.transport_amount || 0) || 0;
  const total     = tuition + transport;

  // Find dues for selected month
  const selectedMonthDues = monthlyDues.find(d => d.month_name === form.billing_month);
  const totalCharged = monthlyDues.reduce(
    (s, d) => s + parseFloat(d.tuition_due || 0) + parseFloat(d.transport_due || 0) - parseFloat(d.concession || 0), 0
  );
  const totalPaid = monthlyDues.reduce(
    (s, d) => s + parseFloat(d.tuition_paid || 0) + parseFloat(d.transport_paid || 0), 0
  );
  const totalDue = totalCharged - totalPaid;

  // ── Resolve student on blur ─────────────────────────────────────────────────
  const searchStudents = async () => {
    const q = form.admission_number.trim();
    if (!q) return;
    setStudentLoading(true);
    setStudentError('');
    setSearchSuggestions([]);
    setShowSuggestions(true);
    
    try {
      const res = await api.get(`/api/students/search?q=${encodeURIComponent(q)}&academicYear=${selectedAcademicYear}`);
      const results = res.data || [];
      if (results.length === 0) {
        setStudentError(`No student found matching "${q}"`);
        setShowSuggestions(false);
      } else if (results.length === 1) {
        // Auto-select if exact one match
        handleSelectStudent(results[0].adm_no);
        setShowSuggestions(false);
      } else {
        setSearchSuggestions(results);
      }
    } catch (err) {
      setStudentError('Error searching for student: ' + (err?.response?.data?.error || err.message));
      setShowSuggestions(false);
    } finally {
      setStudentLoading(false);
    }
  };

  const handleSelectStudent = async (admNo) => {
    setStudentLoading(true);
    setStudentError('');
    setStudent(null);
    setMonthlyDues([]);
    setSearchSuggestions([]);
    setShowSuggestions(false);
    
    // update input field to show the selected admission number
    setForm(prev => ({ ...prev, admission_number: admNo }));

    try {
      const res = await api.get(
        `/api/students/adm/${encodeURIComponent(admNo)}?academicYear=${selectedAcademicYear}`
      );
      const studentData = res.data || res;
      setStudent(studentData);
      setMonthlyDues(studentData.monthly_dues || []);
    } catch {
      setStudentError(`Failed to fetch details for "${admNo}"`);
    } finally {
      setStudentLoading(false);
    }
  };

  // Allow pressing Enter to search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchStudents();
    }
  };

  // ── Handle form field changes ───────────────────────────────────────────────
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccess(null);
    setSubmitError('');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student) { setSubmitError('Please resolve a student first.'); return; }
    if (!form.billing_month) { setSubmitError('Please select a billing month.'); return; }
    if (total <= 0) { setSubmitError('Tuition or Transport amount must be greater than zero.'); return; }

    setSubmitting(true);
    setSubmitError('');
    setSuccess(null);

    try {
      const payload = {
        admission_number: student.adm_no,
        billing_month: form.billing_month,
        payment_date: form.payment_date,
        tuition_amount: tuition,
        transport_amount: transport,
        payment_mode: form.payment_mode,
        receipt_no: form.receipt_no.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const res = await api.post(
        `/api/fees/manual-entry?academicYear=${selectedAcademicYear}`,
        payload
      );
      setSuccess({ receipt_no: res.data.receipt_no, message: res.data.message });
      setMonthlyDues(res.data.monthly_dues || []);
      // Reset payment fields but keep the student so admin can enter next month
      setForm(prev => ({
        ...prev,
        billing_month: '',
        tuition_amount: '',
        transport_amount: '',
        receipt_no: '',
        notes: '',
        payment_date: new Date().toISOString().split('T')[0],
      }));
    } catch (err) {
      setSubmitError(err?.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset everything ────────────────────────────────────────────────────────
  const handleReset = () => {
    setForm(initialForm);
    setStudent(null);
    setMonthlyDues([]);
    setSuccess(null);
    setStudentError('');
    setSubmitError('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setTimeout(() => admNoRef.current?.focus(), 50);
  };

  // ── Month status badge ──────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      PAID:    'bg-emerald-100 text-emerald-700',
      PARTIAL: 'bg-amber-100 text-amber-700',
      UNPAID:  'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status || 'UNPAID'}
      </span>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="text-violet-600" size={26} />
            Manual Fee Entry
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Backfill historical payments month-by-month. Student dues are updated immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT — Entry Form ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Success Banner */}
            {success && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-emerald-800">{success.message}</p>
                  <p className="text-sm text-emerald-600">Receipt No: <strong>{success.receipt_no}</strong></p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {submitError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                <p className="text-red-700 text-sm">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── Student Lookup ───────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Search size={14} /> Student Lookup
                </h2>

                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Admission Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={admNoRef}
                      type="text"
                      id="admission_number"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      placeholder="e.g. 654 or John"
                      value={form.admission_number}
                      onChange={e => handleChange('admission_number', e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      type="button"
                      onClick={searchStudents}
                      className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      {studentLoading && !showSuggestions
                        ? <Loader2 className="animate-spin" size={16} />
                        : <Search size={16} />
                      }
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Type admission number or name and click search.</p>
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchSuggestions.map((s) => (
                        <div
                          key={s.id}
                          className="px-4 py-2 hover:bg-violet-50 cursor-pointer border-b last:border-0"
                          onClick={() => handleSelectStudent(s.adm_no)}
                        >
                          <div className="font-medium text-sm text-gray-800">{s.name} <span className="text-gray-500 font-normal">({s.adm_no})</span></div>
                          <div className="text-xs text-gray-500">Class: {s.class_name} {s.father_name ? `| Father: ${s.father_name}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {studentError && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={14} /> {studentError}
                  </div>
                )}

                {student && (
                  <div className="mt-4 flex items-center gap-4 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 font-bold text-lg">
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {student.name}
                        {student.gender && (
                          <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{student.gender}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Adm: <strong>{student.adm_no}</strong> &nbsp;|&nbsp; Class: <strong>{student.class_name}</strong>
                      </p>
                      {student.father_name && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Father: <strong>{student.father_name}</strong>
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-xs text-gray-500">Outstanding</p>
                      <p className={`font-bold ${totalDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {fmt(Math.max(0, totalDue))}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Payment Details ──────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <IndianRupee size={14} /> Payment Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Billing Month */}
                  <div>
                    <label htmlFor="billing_month" className="block text-xs font-medium text-gray-600 mb-1">
                      Billing Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="billing_month"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      value={form.billing_month}
                      onChange={e => handleChange('billing_month', e.target.value)}
                      required
                    >
                      <option value="">Select Month</option>
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {selectedMonthDues && (
                      <p className="text-xs mt-1 text-gray-500">
                        Existing: {statusBadge(selectedMonthDues.status)} &nbsp;
                        Paid: {fmt(parseFloat(selectedMonthDues.tuition_paid||0)+parseFloat(selectedMonthDues.transport_paid||0))}
                        &nbsp;/ Due: {fmt(parseFloat(selectedMonthDues.tuition_due||0)+parseFloat(selectedMonthDues.transport_due||0)-parseFloat(selectedMonthDues.concession||0))}
                      </p>
                    )}
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label htmlFor="payment_date" className="block text-xs font-medium text-gray-600 mb-1">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="payment_date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      value={form.payment_date}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => handleChange('payment_date', e.target.value)}
                      required
                    />
                  </div>

                  {/* Tuition Amount */}
                  <div>
                    <label htmlFor="tuition_amount" className="block text-xs font-medium text-gray-600 mb-1">
                      Tuition Amount (₹)
                    </label>
                    <input
                      type="number"
                      id="tuition_amount"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      placeholder="0"
                      value={form.tuition_amount}
                      onChange={e => handleChange('tuition_amount', e.target.value)}
                    />
                  </div>

                  {/* Transport Amount */}
                  <div>
                    <label htmlFor="transport_amount" className="block text-xs font-medium text-gray-600 mb-1">
                      Transport Amount (₹)
                    </label>
                    <input
                      type="number"
                      id="transport_amount"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      placeholder="0"
                      value={form.transport_amount}
                      onChange={e => handleChange('transport_amount', e.target.value)}
                    />
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label htmlFor="payment_mode" className="block text-xs font-medium text-gray-600 mb-1">
                      Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="payment_mode"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      value={form.payment_mode}
                      onChange={e => handleChange('payment_mode', e.target.value)}
                      required
                    >
                      {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Receipt No */}
                  <div>
                    <label htmlFor="receipt_no" className="block text-xs font-medium text-gray-600 mb-1">
                      Receipt No <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="receipt_no"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      placeholder="Auto-generated if blank"
                      value={form.receipt_no}
                      onChange={e => handleChange('receipt_no', e.target.value)}
                    />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-xs font-medium text-gray-600 mb-1">
                      Notes <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none"
                      placeholder="e.g. Collected from parent at gate — backfilled"
                      value={form.notes}
                      onChange={e => handleChange('notes', e.target.value)}
                    />
                  </div>

                </div>

                {/* Total display */}
                {total > 0 && (
                  <div className="mt-4 flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Total Payment</span>
                    <span className="text-xl font-bold text-violet-700">{fmt(total)}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !student}
                    id="manual-fee-submit-btn"
                    className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {submitting
                      ? <><Loader2 className="animate-spin" size={16} /> Saving...</>
                      : <><CheckCircle size={16} /> Record Payment</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* ── RIGHT — Monthly Dues Summary ─────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Calendar size={14} /> Month-wise Status
              </h2>

              {!student ? (
                <div className="text-center py-10 text-gray-400">
                  <User size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Search for a student to see dues</p>
                </div>
              ) : monthlyDues.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No monthly dues configured yet.</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Go to Fee Setup → create a class template → Apply.
                  </p>
                </div>
              ) : (
                <>
                  {/* Annual summary */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Charged</p>
                      <p className="font-bold text-blue-700 text-sm">{fmt(totalCharged)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Paid</p>
                      <p className="font-bold text-emerald-700 text-sm">{fmt(totalPaid)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Due</p>
                      <p className="font-bold text-red-600 text-sm">{fmt(Math.max(0, totalDue))}</p>
                    </div>
                  </div>

                  {/* Month-by-month list */}
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {monthlyDues.map(d => {
                      const charged = parseFloat(d.tuition_due||0) + parseFloat(d.transport_due||0) - parseFloat(d.concession||0);
                      const paid    = parseFloat(d.tuition_paid||0) + parseFloat(d.transport_paid||0);
                      const isSelected = d.month_name === form.billing_month;
                      return (
                        <div
                          key={d.month_name}
                          onClick={() => handleChange('billing_month', d.month_name)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                            isSelected ? 'bg-violet-100 border border-violet-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-xs font-medium text-gray-700 w-20">{d.month_name}</span>
                          {statusBadge(d.status)}
                          <span className="text-xs text-gray-500 text-right">
                            {fmt(paid)}/{fmt(charged)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Click a month to select it</p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
