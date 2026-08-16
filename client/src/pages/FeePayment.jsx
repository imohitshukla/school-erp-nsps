import React, { useState, useEffect, useRef } from 'react';
import { IndianRupee, Search, User, Printer, QrCode, ChevronDown, ChevronUp, Edit2, UserCircle } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

/* ─── MONTH ORDER ─── */
const MONTH_ORDER = ['April','May','June','July','August','September','October','November','December','January','February','March'];
const MONTH_INDEX = Object.fromEntries(MONTH_ORDER.map((m, i) => [m, i + 1]));

/* ─── Build installment list from monthly_dues ─── */
const buildInstallments = (monthlyDues, student) => {
  const installments = [];

  // Find if there's a special "Admission" row (month_index = 0)
  const admissionRow = monthlyDues.find(m => m.month_index === 0 || m.month_name === 'Admission');
  
  // Add Admission Fee as first installment (one-time annual charge)
  const annualCharge = parseFloat(student?.payable_fee || 0);
  const monthlyTuition = monthlyDues.find(m => m.month_index >= 1);
  
  if (admissionRow) {
    const adm = admissionRow;
    const payable = parseFloat(adm.tuition_due || 0) + parseFloat(adm.transport_due || 0) + parseFloat(adm.other_due || 0) - parseFloat(adm.concession || 0);
    const paid    = parseFloat(adm.tuition_paid || 0) + parseFloat(adm.transport_paid || 0) + parseFloat(adm.other_paid || 0);
    installments.push({
      sr: 1,
      title: 'Admission Fee',
      isOneTime: true,
      monthName: 'Admission',
      monthIndex: 0,
      tuitionDue: parseFloat(adm.tuition_due || 0),
      transportDue: parseFloat(adm.transport_due || 0),
      otherDue: parseFloat(adm.other_due || 0),
      concession: parseFloat(adm.concession || 0),
      payable,
      tuitionPaid: parseFloat(adm.tuition_paid || 0),
      transportPaid: parseFloat(adm.transport_paid || 0),
      otherPaid: parseFloat(adm.other_paid || 0),
      paid,
      due: payable - paid,
      status: adm.status || (paid >= payable && payable > 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID'),
      receiptNo: adm.receipt_no,
    });
  }

  // Add monthly installments
  const monthlyRows = monthlyDues
    .filter(m => m.month_index >= 1)
    .sort((a, b) => a.month_index - b.month_index);

  monthlyRows.forEach((m, idx) => {
    const payable = parseFloat(m.tuition_due || 0) + parseFloat(m.transport_due || 0) + parseFloat(m.other_due || 0) - parseFloat(m.concession || 0);
    const paid    = parseFloat(m.tuition_paid || 0) + parseFloat(m.transport_paid || 0) + parseFloat(m.other_paid || 0);
    installments.push({
      sr: installments.length + 1,
      title: `${m.month_name} Fee`,
      isOneTime: false,
      monthName: m.month_name,
      monthIndex: m.month_index,
      tuitionDue: parseFloat(m.tuition_due || 0),
      transportDue: parseFloat(m.transport_due || 0),
      otherDue: parseFloat(m.other_due || 0),
      concession: parseFloat(m.concession || 0),
      payable,
      tuitionPaid: parseFloat(m.tuition_paid || 0),
      transportPaid: parseFloat(m.transport_paid || 0),
      otherPaid: parseFloat(m.other_paid || 0),
      paid,
      due: payable - paid,
      status: m.status || (paid >= payable && payable > 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID'),
      receiptNo: m.receipt_no,
    });
  });

  return installments;
};

/* ─── Main Component ─── */
const FeePayment = () => {
  const { selectedAcademicYear } = useAppContext();

  // Search state
  const [admNo, setAdmNo] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentAdm, setSelectedStudentAdm] = useState('');
  const [classList, setClassList] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]);

  // Student data
  const [activeStudent, setActiveStudent] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [siblings, setSiblings] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  // Selected installment for payment
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');

  // Payment form
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [schoolReceiptNo, setSchoolReceiptNo] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [keepDetails, setKeepDetails] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch classes on mount
  useEffect(() => {
    api.get('/api/students/classes')
      .then(r => setClassList(r.data || []))
      .catch(() => {});
  }, []);

  const loadStudent = (studentData) => {
    setActiveStudent(studentData);
    const built = buildInstallments(studentData.monthly_dues || [], studentData);
    setInstallments(built);
    setSelectedInstallment(null);
    setPaidAmount('');
    setError('');
    setSuccess('');

    // Fetch siblings (students sharing same class family or family_no if exists)
    // For now we simulate by fetching same-class students with similar adm pattern
    // A real implementation would query by family_id
    setSiblings([]); // Will be fetched separately
    fetchSiblings(studentData.adm_no, studentData.class_name);
  };

  const fetchSiblings = async (admNo, className) => {
    // Try to find students at this school sharing fee records
    // In the real DB we don't have family_id, so we skip or leave empty
    // We'll leave this as empty for now and let it be filled via future family linking
    setSiblings([]);
  };

  const searchStudent = async (adm) => {
    const searchAdm = adm || admNo;
    if (!searchAdm.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/students/adm/${searchAdm.trim()}?academicYear=${selectedAcademicYear}`);
      loadStudent(response.data);
      setSelectedClass(response.data.class_name || '');
      setSelectedStudentAdm(response.data.adm_no);
      fetchStudentsByClass(response.data.class_name);
    } catch {
      setError('Student not found.');
      setActiveStudent(null);
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async (className) => {
    if (!className) return;
    try {
      const r = await api.get(`/api/students/class/${encodeURIComponent(className)}`);
      setStudentsInClass(r.data || []);
    } catch {}
  };

  useEffect(() => {
    if (selectedClass) fetchStudentsByClass(selectedClass);
  }, [selectedClass]);

  const handleStudentSelect = async (e) => {
    const adm = e.target.value;
    setSelectedStudentAdm(adm);
    if (adm) {
      await searchStudent(adm);
    } else {
      setActiveStudent(null);
      setInstallments([]);
    }
  };

  // Click installment → populate right panel
  const handleInstallmentClick = (inst) => {
    if (inst.status === 'PAID') return; // Can't re-pay a fully paid installment
    setSelectedInstallment(inst);
    setPaidAmount(inst.due > 0 ? String(inst.due) : '');
    setError('');
    setSuccess('');
  };

  // Compute right-panel values
  const rpPayable   = selectedInstallment ? selectedInstallment.payable : 0;
  const rpConcession = selectedInstallment ? selectedInstallment.concession : 0;
  const rpNetPayable = rpPayable; // concession already deducted
  const rpPaid      = parseFloat(paidAmount) || 0;
  const rpDue       = Math.max(0, rpNetPayable - rpPaid);

  // Annual summary
  const totalPaid = installments.reduce((s, i) => s + i.paid, 0);
  const totalDue  = installments.reduce((s, i) => s + i.due, 0);
  const totalFee  = installments.reduce((s, i) => s + i.payable, 0);
  const currentDue = selectedInstallment ? selectedInstallment.due : (installments.find(i => i.status !== 'PAID')?.due || 0);

  const handleTakeFee = async () => {
    if (!activeStudent) { setError('Select a student first.'); return; }
    if (!selectedInstallment) { setError('Select an installment from the list.'); return; }
    if (rpPaid <= 0) { setError('Enter a valid paid amount.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/fees/collect', {
        student_id: activeStudent.adm_no,
        amount: rpPaid,
        tuition_amount: selectedInstallment.isOneTime ? rpPaid : (selectedInstallment.tuitionDue - selectedInstallment.tuitionPaid),
        transport_amount: selectedInstallment.isOneTime ? 0 : (selectedInstallment.transportDue - selectedInstallment.transportPaid),
        months: [selectedInstallment.monthName],
        payment_mode: paymentMode,
        notes: paymentNote,
        receipt_no: schoolReceiptNo || undefined,
      });

      setSuccess(`✅ Receipt ${response.data.receipt_no} generated for ₹${rpPaid.toLocaleString()}`);

      // Refresh student
      const refreshed = await api.get(`/api/students/adm/${activeStudent.adm_no}?academicYear=${selectedAcademicYear}`);
      loadStudent(refreshed.data);

      if (!keepDetails) {
        setPaymentNote('');
        setSchoolReceiptNo('');
        setPaymentMode('Cash');
        setPaymentDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to collect fee.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedInstallment(null);
    setPaidAmount('');
    setPaymentNote('');
    setSchoolReceiptNo('');
    setPaymentMode('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setSuccess('');
  };

  const formatRupee = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#222' }}>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <IndianRupee size={18} style={{ color: '#4B0082' }} />
        <h1 style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>Fee Payment</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ width: 390, flexShrink: 0 }}>
          {/* Search box + dropdowns */}
          <div style={{ background: '#fff', border: '1px solid #ccc', padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              {/* Admission No search */}
              <input
                type="text"
                placeholder="Adm No"
                value={admNo}
                onChange={e => setAdmNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStudent()}
                style={{ flex: 1, border: '1px solid #999', padding: '4px 8px', fontSize: 13 }}
              />
              {/* Class dropdown */}
              <select
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setSelectedStudentAdm(''); setActiveStudent(null); setInstallments([]); }}
                style={{ width: 110, border: '1px solid #999', padding: '4px 4px', fontSize: 13 }}
              >
                <option value="">Class</option>
                {classList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {/* Student dropdown */}
              <select
                value={selectedStudentAdm}
                onChange={handleStudentSelect}
                disabled={!selectedClass}
                style={{ width: 130, border: '1px solid #999', padding: '4px 4px', fontSize: 13 }}
              >
                <option value="">Student</option>
                {studentsInClass.map(s => (
                  <option key={s.adm_no} value={s.adm_no}>{s.name} ({s.adm_no})</option>
                ))}
              </select>
            </div>

            {/* Stats row */}
            {activeStudent && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                <StatChip label="Total Paids" value={formatRupee(totalPaid)} color="#22c55e" />
                <StatChip label="Current Due" value={formatRupee(currentDue)} color="#f97316" />
                <StatChip label="Total Due" value={formatRupee(totalDue)} color="#ef4444" />
                <StatChip label="Refund Amount" value="₹0" color="#f97316" />
                <StatChip label="Voucher Due" value="₹0" color="#f97316" />
              </div>
            )}

            {/* Buttons row */}
            {activeStudent && (
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn icon={<QrCode size={13}/>} label="Download QR" onClick={() => {}} color="#6366f1" />
                <ActionBtn icon={<Printer size={13}/>} label="PDF" onClick={() => {}} color="#6366f1" />
                <ActionBtn icon={<UserCircle size={13}/>} label="Student" onClick={() => {}} color="#6366f1" />
              </div>
            )}
          </div>

          {/* Sibling Details */}
          {activeStudent && (
            <div style={{ background: '#fff', border: '1px solid #ccc', marginBottom: 8 }}>
              <div style={{ background: '#f5f5f5', padding: '6px 10px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCircle size={14} style={{ color: '#f97316' }} />
                Sibling Details
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    {['Name','Class','Roll Number','Adm. Number','Action'].map(h => (
                      <th key={h} style={{ padding: '5px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {siblings.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '8px', color: '#999', textAlign: 'center', fontSize: 11 }}>No sibling records linked</td></tr>
                  ) : siblings.map((sib, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={{ padding: '4px 8px' }}>{sib.name}</td>
                      <td style={{ padding: '4px 8px' }}>{sib.class_name}</td>
                      <td style={{ padding: '4px 8px' }}>{sib.roll_no || '-'}</td>
                      <td style={{ padding: '4px 8px' }}>{sib.adm_no}</td>
                      <td style={{ padding: '4px 8px' }}>
                        <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>
                          <Edit2 size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Details accordion */}
          {activeStudent && (
            <div style={{ background: '#fff', border: '1px solid #ccc', marginBottom: 8, padding: '6px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCircle size={14} style={{ color: '#f97316' }} />
                <span style={{ fontWeight: 600 }}>Details</span>
                <span
                  style={{ color: '#3b82f6', cursor: 'pointer', marginLeft: 4, fontSize: 12 }}
                  onClick={() => setShowDetails(v => !v)}
                >
                  {showDetails ? 'hide' : 'show'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <ActionBtn label="Follow up" onClick={() => {}} color="#6b7280" small />
                  <ActionBtn label="+ Add Notes" onClick={() => {}} color="#6b7280" small />
                </div>
              </div>
              {showDetails && activeStudent && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#555', lineHeight: 1.8 }}>
                  <div><b>Name:</b> {activeStudent.name}</div>
                  <div><b>Class:</b> {activeStudent.class_name}</div>
                  <div><b>Adm No:</b> {activeStudent.adm_no}</div>
                  <div><b>Annual Fee:</b> {formatRupee(activeStudent.payable_fee)}</div>
                  <div><b>Paid:</b> {formatRupee(activeStudent.paid_past)}</div>
                  <div><b>Concession:</b> {formatRupee(activeStudent.concession)}</div>
                </div>
              )}
            </div>
          )}

          {/* Installment list */}
          {activeStudent && installments.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #ccc' }}>
              <div style={{ background: '#f5f5f5', padding: '6px 10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Installment</span>
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{installments.length}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={thStyle}>Sr.</th>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Details</th>
                    <th style={{ ...thStyle, background: '#f97316', color: '#fff' }}>Print / Cancel</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map(inst => {
                    const isPaid = inst.status === 'PAID';
                    const isSelected = selectedInstallment?.monthName === inst.monthName;
                    return (
                      <tr
                        key={inst.monthName}
                        onClick={() => handleInstallmentClick(inst)}
                        style={{
                          cursor: isPaid ? 'default' : 'pointer',
                          background: isSelected ? '#dbeafe' : isPaid ? '#d1fae5' : '#fff',
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={tdStyle}>{inst.sr}</td>
                        <td style={tdStyle}>{inst.title}</td>
                        <td style={{ ...tdStyle, color: '#555', fontSize: 11 }}>
                          {isPaid
                            ? <span style={{ color: '#16a34a' }}>Payable = {inst.payable} Paid = {inst.paid}, Due = 0</span>
                            : <span>Payable = {inst.payable}</span>
                          }
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {isPaid && (
                            <button
                              onClick={e => e.stopPropagation()}
                              style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}
                            >
                              Print
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!activeStudent && (
            <div style={{ padding: 32, textAlign: 'center', color: '#999', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }}>
              <IndianRupee size={40} style={{ margin: '0 auto 12px', color: '#ddd' }} />
              <p>Enter an admission number or select a student to begin</p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #ccc' }}>
          {/* Header */}
          <div style={{ background: '#f5f5f5', padding: '8px 12px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>Fee Structure</span>
            <span style={{ color: '#3b82f6', cursor: 'pointer', fontSize: 12 }}>Get Help</span>
          </div>

          {selectedInstallment ? (
            <div style={{ padding: 12 }}>
              {/* Hindi instruction */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '6px 10px', fontSize: 12, color: '#92400e', marginBottom: 10, lineHeight: 1.5 }}>
                Hit "ENTER" or Equal(=) button after entering "Paid" amount / भुगतान राशि दर्ज करने के बाद एंटर या समान (=) बटन दबाएं
              </div>

              {/* Fee breakdown table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={thStyle}>Title</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Payable</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Paid</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Tuition */}
                  {selectedInstallment.tuitionDue > 0 && (
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={tdStyle}>Tuition Fee</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{selectedInstallment.tuitionDue}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#16a34a' }}>{selectedInstallment.tuitionPaid}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444' }}>{Math.max(0, selectedInstallment.tuitionDue - selectedInstallment.tuitionPaid)}</td>
                    </tr>
                  )}
                  {/* Transport */}
                  {selectedInstallment.transportDue > 0 && (
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={tdStyle}>Transport</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{selectedInstallment.transportDue}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#16a34a' }}>{selectedInstallment.transportPaid}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444' }}>{Math.max(0, selectedInstallment.transportDue - selectedInstallment.transportPaid)}</td>
                    </tr>
                  )}
                  {/* Other */}
                  {selectedInstallment.otherDue > 0 && (
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={tdStyle}>Other Charges</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{selectedInstallment.otherDue}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#16a34a' }}>{selectedInstallment.otherPaid}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444' }}>{Math.max(0, selectedInstallment.otherDue - selectedInstallment.otherPaid)}</td>
                    </tr>
                  )}
                  {/* Summary rows */}
                  <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9f9f9' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>Amount</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{selectedInstallment.tuitionDue + selectedInstallment.transportDue + selectedInstallment.otherDue}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{selectedInstallment.paid}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{selectedInstallment.due}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Concession</td>
                    <td colSpan={2} />
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#f97316' }}>{selectedInstallment.concession}</td>
                  </tr>
                  <tr style={{ background: '#f9f9f9' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>Payable (Amount - Concession)</td>
                    <td colSpan={2} />
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{rpPayable}</td>
                  </tr>
                  {/* Paid input row */}
                  <tr style={{ background: '#fff3e0' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#333' }}>Paid</td>
                    <td colSpan={2} />
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={e => setPaidAmount(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleTakeFee()}
                          style={{ width: 80, border: '1px solid #999', padding: '3px 6px', fontSize: 13, textAlign: 'right' }}
                        />
                        <button
                          onClick={handleTakeFee}
                          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
                        >=</button>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ background: '#fef2f2' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>Due (Payable - Paid)</td>
                    <td colSpan={2} />
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#ef4444', fontSize: 14 }}>{rpDue}</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment form */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={labelStyle}>Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    style={inputStyle}
                  >
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                    <option>Online</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>School Receipt No</label>
                  <input
                    type="text"
                    placeholder="School Receipt No"
                    value={schoolReceiptNo}
                    onChange={e => setSchoolReceiptNo(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Payment Note</label>
                  <input
                    type="text"
                    placeholder="Payment Note"
                    value={paymentNote}
                    onChange={e => setPaymentNote(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Keep same checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={keepDetails} onChange={e => setKeepDetails(e.target.checked)} />
                Keep same payment detail for the next fee payment
              </label>

              {/* Error / Success */}
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '6px 10px', borderRadius: 4, marginBottom: 8, fontSize: 12 }}>{error}</div>}
              {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '6px 10px', borderRadius: 4, marginBottom: 8, fontSize: 12 }}>{success}</div>}

              {/* Take Fee / Reset */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={handleReset}
                  style={{ border: '1px solid #ccc', background: '#fff', padding: '6px 20px', cursor: 'pointer', borderRadius: 4, fontSize: 13 }}
                >
                  Reset
                </button>
                <button
                  onClick={handleTakeFee}
                  disabled={loading}
                  style={{ background: '#4B0082', color: '#fff', border: 'none', padding: '6px 24px', cursor: 'pointer', borderRadius: 4, fontWeight: 700, fontSize: 13, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Processing...' : 'Take Fee'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
              {activeStudent
                ? '← Select an installment from the left panel to collect fee'
                : 'Search for a student to view fee structure'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Small helpers ─── */
const StatChip = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', minWidth: 80 }}>
    <div style={{ fontSize: 10, color: '#555', marginBottom: 1 }}>{label}</div>
    <div style={{ background: color, color: '#fff', borderRadius: 3, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>{value}</div>
  </div>
);

const ActionBtn = ({ icon, label, onClick, color, small }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: color, color: '#fff',
      border: 'none', borderRadius: 3,
      padding: small ? '3px 8px' : '4px 10px',
      cursor: 'pointer', fontSize: small ? 11 : 12,
    }}
  >
    {icon}{label}
  </button>
);

const thStyle = { padding: '6px 8px', textAlign: 'left', background: '#f5f5f5', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 11 };
const tdStyle = { padding: '5px 8px', fontSize: 12 };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 };
const inputStyle = { width: '100%', border: '1px solid #ccc', padding: '5px 8px', fontSize: 13, boxSizing: 'border-box' };

export default FeePayment;
