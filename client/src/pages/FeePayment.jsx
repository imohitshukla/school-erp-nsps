import React, { useState, useEffect, useRef } from 'react';
import { IndianRupee, Search, User, Printer, QrCode, UserCircle, Edit2 } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

/* ─── Build installment list from monthly_dues ─── */
const buildInstallments = (monthlyDues) => {
  const installments = [];

  const sorted = [...monthlyDues].sort((a, b) => a.month_index - b.month_index);

  for (const m of sorted) {
    const isOneTime = m.is_one_time || m.month_index === 0 || m.month_name === 'Admission';

    if (isOneTime) {
      // One-time admission row — show individual one-time heads
      const admFee   = parseFloat(m.admission_fee_due || 0);
      const annualFee = parseFloat(m.annual_fee_due || 0);
      const idCard   = parseFloat(m.id_card_due || 0);
      const examFee  = parseFloat(m.exam_fee_due || 0);
      const totalDue = parseFloat(m.other_due || 0) || (admFee + annualFee + idCard + examFee);
      const totalPaid = parseFloat(m.admission_fee_paid || 0) + parseFloat(m.annual_fee_paid || 0) +
                        parseFloat(m.id_card_paid || 0) + parseFloat(m.exam_fee_paid || 0) +
                        parseFloat(m.other_paid || 0);

      installments.push({
        sr: installments.length + 1,
        title: 'Admission / Annual Charges',
        isOneTime: true,
        monthName: m.month_name,
        monthIndex: 0,
        heads: [
          { key: 'admission', label: 'Admission Fee', due: admFee,    paid: parseFloat(m.admission_fee_paid || 0) },
          { key: 'annual',    label: 'Annual Charge',  due: annualFee, paid: parseFloat(m.annual_fee_paid   || 0) },
          { key: 'id_card',   label: 'ID Card',        due: idCard,    paid: parseFloat(m.id_card_paid      || 0) },
          { key: 'exam',      label: 'Exam Fee',       due: examFee,   paid: parseFloat(m.exam_fee_paid     || 0) },
        ].filter(h => h.due > 0),
        totalDue,
        totalPaid: Math.min(totalPaid, totalDue),
        concession: parseFloat(m.concession || 0),
        status: m.status || (totalPaid >= totalDue && totalDue > 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        receiptNo: m.receipt_no,
      });
    } else {
      // Monthly recurring row
      const tuitionDue   = parseFloat(m.tuition_due   || 0);
      const transportDue = parseFloat(m.transport_due || 0);
      const otherDue     = parseFloat(m.other_due     || 0);
      const concession   = parseFloat(m.concession    || 0);
      const totalDue     = tuitionDue + transportDue + otherDue - concession;
      const totalPaid    = parseFloat(m.tuition_paid || 0) + parseFloat(m.transport_paid || 0) + parseFloat(m.other_paid || 0);

      installments.push({
        sr: installments.length + 1,
        title: `${m.month_name} Fee`,
        isOneTime: false,
        monthName: m.month_name,
        monthIndex: m.month_index,
        heads: [
          { key: 'tuition',   label: 'Tuition Fee',  due: tuitionDue,   paid: parseFloat(m.tuition_paid   || 0) },
          { key: 'transport', label: 'Transport Fee', due: transportDue, paid: parseFloat(m.transport_paid || 0) },
          { key: 'other',     label: 'Other Charges', due: otherDue,     paid: parseFloat(m.other_paid     || 0) },
        ].filter(h => h.due > 0),
        totalDue,
        totalPaid: Math.min(totalPaid, totalDue),
        concession,
        status: m.status || (totalPaid >= totalDue && totalDue > 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        receiptNo: m.receipt_no,
      });
    }
  }

  return installments;
};

/* ─── Main Component ─── */
const FeePayment = () => {
  const { selectedAcademicYear } = useAppContext();

  const [admNo, setAdmNo]                     = useState('');
  const [selectedClass, setSelectedClass]     = useState('');
  const [selectedStudentAdm, setSelectedStudentAdm] = useState('');
  const [classList, setClassList]             = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]);

  const [activeStudent, setActiveStudent]   = useState(null);
  const [installments, setInstallments]     = useState([]);
  const [siblings, setSiblings]             = useState([]);
  const [showDetails, setShowDetails]       = useState(false);

  const [selectedInstallment, setSelectedInstallment] = useState(null);
  // paidHeads: { tuition: '800', transport: '500', other: '0', admission: '2000', ... }
  const [paidHeads, setPaidHeads] = useState({});

  const [paymentMode, setPaymentMode]       = useState('Cash');
  const [paymentDate, setPaymentDate]       = useState(new Date().toISOString().split('T')[0]);
  const [schoolReceiptNo, setSchoolReceiptNo] = useState('');
  const [paymentNote, setPaymentNote]       = useState('');
  const [keepDetails, setKeepDetails]       = useState(false);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    api.get('/api/students/classes').then(r => setClassList(r.data || [])).catch(() => {});
  }, []);

  const loadStudent = (studentData) => {
    setActiveStudent(studentData);
    const built = buildInstallments(studentData.monthly_dues || []);
    setInstallments(built);
    setSelectedInstallment(null);
    setPaidHeads({});
    setError('');
    setSuccess('');
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

  useEffect(() => { if (selectedClass) fetchStudentsByClass(selectedClass); }, [selectedClass]);

  const handleStudentSelect = async (e) => {
    const adm = e.target.value;
    setSelectedStudentAdm(adm);
    if (adm) await searchStudent(adm);
    else { setActiveStudent(null); setInstallments([]); }
  };

  const handleInstallmentClick = (inst) => {
    if (inst.status === 'PAID') return;
    setSelectedInstallment(inst);
    // Pre-fill each head with the remaining due
    const initial = {};
    for (const h of inst.heads) {
      initial[h.key] = String(Math.max(0, h.due - h.paid));
    }
    setPaidHeads(initial);
    setError('');
    setSuccess('');
  };

  // Total being paid now = sum of all editable head inputs
  const totalNowPaying = selectedInstallment
    ? selectedInstallment.heads.reduce((sum, h) => sum + (parseFloat(paidHeads[h.key] || 0)), 0)
    : 0;

  // Remaining due after this payment
  const dueAfterPayment = selectedInstallment
    ? Math.max(0, selectedInstallment.totalDue - selectedInstallment.totalPaid - totalNowPaying)
    : 0;

  // Annual summary — EXCLUDE one-time from monthly totals
  const monthlyInstallments = installments.filter(i => !i.isOneTime);
  const oneTimeInstallments = installments.filter(i => i.isOneTime);

  const monthlyTotalDue   = monthlyInstallments.reduce((s, i) => s + i.totalDue, 0);
  const monthlyTotalPaid  = monthlyInstallments.reduce((s, i) => s + i.totalPaid, 0);
  const oneTimeTotalDue   = oneTimeInstallments.reduce((s, i) => s + i.totalDue, 0);
  const oneTimeTotalPaid  = oneTimeInstallments.reduce((s, i) => s + i.totalPaid, 0);
  const grandTotalDue     = monthlyTotalDue + oneTimeTotalDue;
  const grandTotalPaid    = monthlyTotalPaid + oneTimeTotalPaid;
  const grandBalance      = grandTotalDue - grandTotalPaid;
  const currentDue        = selectedInstallment ? selectedInstallment.totalDue - selectedInstallment.totalPaid
                          : (installments.find(i => i.status !== 'PAID')?.totalDue || 0);

  const handleTakeFee = async () => {
    if (!activeStudent) { setError('Select a student first.'); return; }
    if (!selectedInstallment) { setError('Select an installment from the list.'); return; }
    if (totalNowPaying <= 0) { setError('Enter payment amount in at least one fee head.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/fees/collect', {
        student_id: activeStudent.adm_no,
        amount: totalNowPaying,
        tuition_amount:   parseFloat(paidHeads['tuition']   || 0),
        transport_amount: parseFloat(paidHeads['transport']  || 0),
        other_amount:     parseFloat(paidHeads['other']      || 0) + parseFloat(paidHeads['admission'] || 0) + parseFloat(paidHeads['annual'] || 0) + parseFloat(paidHeads['id_card'] || 0) + parseFloat(paidHeads['exam'] || 0),
        months: [selectedInstallment.monthName],
        payment_mode: paymentMode,
        notes: paymentNote || (selectedInstallment.isOneTime ? 'One-time charges payment' : `${selectedInstallment.monthName} fee payment`),
        receipt_no: schoolReceiptNo || undefined,
      });

      setSuccess(`✅ Receipt ${response.data.receipt_no} — ₹${totalNowPaying.toLocaleString('en-IN')} collected`);

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
    setPaidHeads({});
    setPaymentNote('');
    setSchoolReceiptNo('');
    setPaymentMode('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setSuccess('');
  };

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#222' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <IndianRupee size={18} style={{ color: '#4B0082' }} />
        <h1 style={{ fontWeight: 700, fontSize: 16 }}>Fee Payment</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: 400, flexShrink: 0 }}>

          {/* Search */}
          <div style={{ background: '#fff', border: '1px solid #ccc', padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input type="text" placeholder="Adm No" value={admNo}
                onChange={e => setAdmNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStudent()}
                style={{ flex: 1, border: '1px solid #999', padding: '4px 8px', fontSize: 13 }} />
              <select value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setSelectedStudentAdm(''); setActiveStudent(null); setInstallments([]); }}
                style={{ width: 100, border: '1px solid #999', padding: '4px', fontSize: 12 }}>
                <option value="">Class</option>
                {classList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={selectedStudentAdm} onChange={handleStudentSelect} disabled={!selectedClass}
                style={{ width: 130, border: '1px solid #999', padding: '4px', fontSize: 12 }}>
                <option value="">Student</option>
                {studentsInClass.map(s => <option key={s.adm_no} value={s.adm_no}>{s.name} ({s.adm_no})</option>)}
              </select>
            </div>

            {/* Stats bar */}
            {activeStudent && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                <StatChip label="Total Paids" value={fmt(grandTotalPaid)} color="#22c55e" />
                <StatChip label="Current Due" value={fmt(currentDue)} color="#f97316" />
                <StatChip label="Total Due" value={fmt(grandBalance)} color="#ef4444" />
                <StatChip label="Refund Amt" value="₹0" color="#f97316" />
                <StatChip label="Voucher Due" value="₹0" color="#f97316" />
              </div>
            )}

            {activeStudent && (
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn icon={<QrCode size={12}/>} label="QR" color="#6366f1" />
                <ActionBtn icon={<Printer size={12}/>} label="PDF" color="#6366f1" />
                <ActionBtn icon={<UserCircle size={12}/>} label="Student" color="#6366f1" />
              </div>
            )}
          </div>

          {/* Sibling Details */}
          {activeStudent && (
            <div style={{ background: '#fff', border: '1px solid #ccc', marginBottom: 8 }}>
              <div style={{ background: '#f5f5f5', padding: '5px 10px', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <UserCircle size={13} style={{ color: '#f97316' }} /> Sibling Details
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: '#f9f9f9' }}>
                  {['Name','Class','Roll No','Adm No','Action'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {siblings.length === 0
                    ? <tr><td colSpan={5} style={{ padding: 8, color: '#aaa', textAlign: 'center' }}>No siblings linked</td></tr>
                    : siblings.map((s, i) => (
                      <tr key={i}>
                        <td style={tdS}>{s.name}</td>
                        <td style={tdS}>{s.class_name}</td>
                        <td style={tdS}>{s.roll_no || '-'}</td>
                        <td style={tdS}>{s.adm_no}</td>
                        <td style={tdS}><button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 2, padding: '1px 5px', fontSize: 10, cursor: 'pointer' }}><Edit2 size={9}/></button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Details accordion */}
          {activeStudent && (
            <div style={{ background: '#fff', border: '1px solid #ccc', marginBottom: 8, padding: '5px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCircle size={13} style={{ color: '#f97316' }} />
                <b style={{ fontSize: 12 }}>Details</b>
                <span style={{ color: '#3b82f6', cursor: 'pointer', fontSize: 11, marginLeft: 4 }} onClick={() => setShowDetails(v => !v)}>
                  {showDetails ? 'hide' : 'show'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                  <ActionBtn label="Follow up" color="#6b7280" small />
                  <ActionBtn label="+ Notes" color="#6b7280" small />
                </div>
              </div>
              {showDetails && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#555', lineHeight: 1.8 }}>
                  <b>Name:</b> {activeStudent.name} &nbsp;|&nbsp;
                  <b>Class:</b> {activeStudent.class_name} &nbsp;|&nbsp;
                  <b>Adm No:</b> {activeStudent.adm_no}
                </div>
              )}
            </div>
          )}

          {/* Installment list */}
          {activeStudent && installments.length > 0 ? (
            <div style={{ background: '#fff', border: '1px solid #ccc' }}>
              <div style={{ background: '#f5f5f5', padding: '5px 10px', fontWeight: 700, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Installments</span>
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{installments.length}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: '#f9f9f9' }}>
                  <th style={thS}>Sr.</th>
                  <th style={thS}>Title</th>
                  <th style={thS}>Details</th>
                  <th style={{ ...thS, background: '#f97316', color: '#fff', textAlign: 'center' }}>Print</th>
                </tr></thead>
                <tbody>
                  {installments.map(inst => {
                    const isPaid     = inst.status === 'PAID';
                    const isSelected = selectedInstallment?.monthName === inst.monthName;
                    const isOneTime  = inst.isOneTime;
                    return (
                      <tr key={inst.monthName}
                        onClick={() => handleInstallmentClick(inst)}
                        style={{
                          cursor: isPaid ? 'default' : 'pointer',
                          background: isSelected ? '#dbeafe' : isPaid ? '#d1fae5' : isOneTime ? '#fffbeb' : '#fff',
                          borderBottom: '1px solid #e5e7eb',
                        }}>
                        <td style={tdS}>{inst.sr}</td>
                        <td style={{ ...tdS, fontWeight: isOneTime ? 700 : 400, color: isOneTime ? '#b45309' : '#222' }}>
                          {inst.title}
                          {isOneTime && <span style={{ fontSize: 9, background: '#f59e0b', color: '#fff', borderRadius: 3, padding: '1px 4px', marginLeft: 4 }}>ONE-TIME</span>}
                        </td>
                        <td style={{ ...tdS, color: '#555', fontSize: 11 }}>
                          {isPaid
                            ? <span style={{ color: '#16a34a' }}>Paid = {fmt(inst.totalPaid)}, Due = ₹0</span>
                            : <span>Payable = {fmt(inst.totalDue)}</span>}
                        </td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          {isPaid && (
                            <button onClick={e => e.stopPropagation()}
                              style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 2, padding: '2px 7px', fontSize: 10, cursor: 'pointer' }}>
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
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#999', background: '#fff', border: '1px solid #e5e7eb' }}>
              <IndianRupee size={36} style={{ margin: '0 auto 10px', color: '#ddd' }} />
              <p style={{ fontSize: 12 }}>Search for a student to begin</p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #ccc', minWidth: 0 }}>
          <div style={{ background: '#f5f5f5', padding: '7px 12px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
            <b style={{ fontSize: 13 }}>Fee Structure</b>
            <span style={{ color: '#3b82f6', fontSize: 11, cursor: 'pointer' }}>Get Help</span>
          </div>

          {selectedInstallment ? (
            <div style={{ padding: 14 }}>

              {/* Instruction */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '6px 10px', fontSize: 11, color: '#92400e', marginBottom: 12, lineHeight: 1.5, borderRadius: 4 }}>
                Enter amount in each fee head below → click <b>Take Fee</b> or press Enter
                <br/>भुगतान राशि दर्ज करें और Take Fee दबाएं
              </div>

              {/* One-time badge */}
              {selectedInstallment.isOneTime && (
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '5px 10px', borderRadius: 4, fontSize: 11, color: '#92400e', marginBottom: 10 }}>
                  ⚠️ <b>One-Time Charge</b> — These fees are collected <b>once per year only</b> and are NOT part of the monthly fee total.
                </div>
              )}

              {/* Per-head fee entry table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={thS}>Fee Head</th>
                    <th style={{ ...thS, textAlign: 'right' }}>Payable</th>
                    <th style={{ ...thS, textAlign: 'right' }}>Already Paid</th>
                    <th style={{ ...thS, textAlign: 'right' }}>Due</th>
                    <th style={{ ...thS, textAlign: 'right', background: '#4B0082', color: '#fff', width: 110 }}>Pay Now ✎</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInstallment.heads.map(h => {
                    const due = Math.max(0, h.due - h.paid);
                    return (
                      <tr key={h.key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ ...tdS, fontWeight: 500 }}>{h.label}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>{h.due}</td>
                        <td style={{ ...tdS, textAlign: 'right', color: '#16a34a' }}>{h.paid}</td>
                        <td style={{ ...tdS, textAlign: 'right', color: due > 0 ? '#ef4444' : '#16a34a' }}>{due}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>
                          <input
                            type="number"
                            min={0}
                            max={due}
                            value={paidHeads[h.key] || ''}
                            onChange={e => setPaidHeads(prev => ({ ...prev, [h.key]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleTakeFee()}
                            disabled={due <= 0}
                            style={{
                              width: 90, border: '1px solid #999', padding: '3px 6px',
                              fontSize: 13, textAlign: 'right',
                              background: due <= 0 ? '#f5f5f5' : '#fff',
                              color: due <= 0 ? '#999' : '#222',
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {/* Concession row */}
                  {selectedInstallment.concession > 0 && (
                    <tr style={{ background: '#fef9f0' }}>
                      <td style={{ ...tdS, color: '#f97316', fontStyle: 'italic' }}>Concession</td>
                      <td colSpan={3} />
                      <td style={{ ...tdS, textAlign: 'right', color: '#f97316' }}>-{selectedInstallment.concession}</td>
                    </tr>
                  )}

                  {/* Summary rows */}
                  <tr style={{ background: '#f9f9f9', borderTop: '2px solid #e5e7eb' }}>
                    <td style={{ ...tdS, fontWeight: 700 }}>Total Payable</td>
                    <td colSpan={3} />
                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 700 }}>{selectedInstallment.totalDue}</td>
                  </tr>
                  <tr style={{ background: '#f0fdf4' }}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>Total Paid (this receipt)</td>
                    <td colSpan={3} />
                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
                      {totalNowPaying.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ background: '#fef2f2' }}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#ef4444' }}>Balance Due After Payment</td>
                    <td colSpan={3} />
                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: '#ef4444', fontSize: 14 }}>
                      {dueAfterPayment.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Payment form */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={lblS}>Payment Mode *</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={inpS}>
                    <option>Cash</option><option>Cheque</option><option>UPI</option>
                    <option>Card</option><option>Bank Transfer</option><option>Online</option>
                  </select>
                </div>
                <div>
                  <label style={lblS}>Payment Date *</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inpS} />
                </div>
                <div>
                  <label style={lblS}>School Receipt No</label>
                  <input type="text" placeholder="School Receipt No" value={schoolReceiptNo} onChange={e => setSchoolReceiptNo(e.target.value)} style={inpS} />
                </div>
                <div>
                  <label style={lblS}>Payment Note</label>
                  <input type="text" placeholder="Payment note" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} style={inpS} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#555', marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={keepDetails} onChange={e => setKeepDetails(e.target.checked)} />
                Keep same payment detail for the next fee payment
              </label>

              {error   && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '6px 10px', borderRadius: 4, marginBottom: 8, fontSize: 12 }}>{error}</div>}
              {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '6px 10px', borderRadius: 4, marginBottom: 8, fontSize: 12 }}>{success}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={handleReset} style={{ border: '1px solid #ccc', background: '#fff', padding: '6px 20px', cursor: 'pointer', borderRadius: 4, fontSize: 13 }}>Reset</button>
                <button onClick={handleTakeFee} disabled={loading}
                  style={{ background: '#4B0082', color: '#fff', border: 'none', padding: '7px 28px', cursor: 'pointer', borderRadius: 4, fontWeight: 700, fontSize: 13, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Processing...' : 'Take Fee'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: '#aaa', fontSize: 12 }}>
              {activeStudent ? '← Click an installment from the left panel' : 'Search for a student to view fee structure'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Micro-components ─── */
const StatChip = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', minWidth: 72 }}>
    <div style={{ fontSize: 9, color: '#555', marginBottom: 1 }}>{label}</div>
    <div style={{ background: color, color: '#fff', borderRadius: 3, padding: '2px 6px', fontWeight: 700, fontSize: 11 }}>{value}</div>
  </div>
);

const ActionBtn = ({ icon, label, color, small, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 3, background: color, color: '#fff', border: 'none', borderRadius: 3, padding: small ? '3px 7px' : '4px 9px', cursor: 'pointer', fontSize: small ? 10 : 11 }}>
    {icon}{label}
  </button>
);

/* ─── Shared style objects ─── */
const thS = { padding: '5px 8px', textAlign: 'left', background: '#f5f5f5', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 11 };
const tdS = { padding: '5px 8px', fontSize: 12 };
const lblS = { display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 };
const inpS = { width: '100%', border: '1px solid #ccc', padding: '5px 8px', fontSize: 13, boxSizing: 'border-box' };

export default FeePayment;
