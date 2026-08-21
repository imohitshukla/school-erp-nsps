import React, { useState, useCallback } from 'react';
import { IndianRupee, Printer, QrCode, UserCircle, Edit2 } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { printReceiptPopup } from '../utils/printReceipt';

/* ─── Build installment list from monthly_dues ─── */
const buildInstallments = (monthlyDues) => {
  const installments = [];
  const sorted = [...monthlyDues].sort((a, b) => a.month_index - b.month_index);

  for (const m of sorted) {
    const isOneTime = m.is_one_time || m.month_index === 0 || m.month_name === 'Admission';

    if (isOneTime) {
      const admFee   = parseFloat(m.admission_fee_due || 0);
      const annualFee = parseFloat(m.annual_fee_due || 0);
      const idCard   = parseFloat(m.id_card_due || 0);
      const examFee  = parseFloat(m.exam_fee_due || 0);
      
      const totalDue = parseFloat(m.other_due || 0) || (admFee + annualFee + idCard + examFee);
      const concession = parseFloat(m.concession || 0);
      const netPayable = Math.max(0, totalDue - concession);
      
      const totalPaid = parseFloat(m.admission_fee_paid || 0) + parseFloat(m.annual_fee_paid || 0) +
                        parseFloat(m.id_card_paid || 0) + parseFloat(m.exam_fee_paid || 0) +
                        parseFloat(m.other_paid || 0);

      installments.push({
        sr: installments.length + 1,
        title: 'Admission Fee',
        isOneTime: true,
        monthName: m.month_name,
        monthIndex: 0,
        heads: [
          { key: 'admission', label: 'Admission Fee',           payable: admFee,    paid: parseFloat(m.admission_fee_paid || 0) },
          { key: 'annual',    label: 'Annual / Dev. Charge',   payable: annualFee, paid: parseFloat(m.annual_fee_paid   || 0) },
          { key: 'id_card',   label: 'ID Card Fee',            payable: idCard,    paid: parseFloat(m.id_card_paid      || 0) },
          { key: 'exam',      label: 'Exam Fee',               payable: examFee,   paid: parseFloat(m.exam_fee_paid     || 0) },
        ].filter(h => h.payable > 0),
        amountTotal: totalDue,
        concession,
        netPayable,
        totalPaid: Math.min(totalPaid, netPayable),
        status: m.status || (totalPaid >= netPayable && netPayable > 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        receiptNo: m.receipt_no,
      });
    } else {
      const tuitionDue   = parseFloat(m.tuition_due   || 0);
      const transportDue = parseFloat(m.transport_due || 0);
      const otherDue     = parseFloat(m.other_due     || 0);
      
      const totalDue     = tuitionDue + transportDue + otherDue;
      const concession   = parseFloat(m.concession    || 0);
      const netPayable   = Math.max(0, totalDue - concession);
      
      const totalPaid    = parseFloat(m.tuition_paid || 0) + parseFloat(m.transport_paid || 0) + parseFloat(m.other_paid || 0);

      installments.push({
        sr: installments.length + 1,
        title: `${m.month_name} Fee`,
        isOneTime: false,
        monthName: m.month_name,
        monthIndex: m.month_index,
        heads: [
          { key: 'tuition',   label: 'Tuition Fee',   payable: tuitionDue,   paid: parseFloat(m.tuition_paid   || 0) },
          { key: 'transport', label: 'Transport Fee', payable: transportDue, paid: parseFloat(m.transport_paid || 0) },
          { key: 'other',     label: 'Other Charges', payable: otherDue,     paid: parseFloat(m.other_paid     || 0) },
        ].filter(h => h.payable > 0),
        amountTotal: totalDue,
        concession,
        netPayable,
        totalPaid: Math.min(totalPaid, netPayable),
        status: m.status || (totalPaid >= netPayable && netPayable > 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        receiptNo: m.receipt_no,
      });
    }
  }
  return installments;
};

/* ─── Main Component ─── */
const FeePayment = () => {
  const { selectedAcademicYear } = useAppContext();

  const [admNo, setAdmNo] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentAdm, setSelectedStudentAdm] = useState('');
  const [classList, setClassList] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]);

  const [activeStudent, setActiveStudent] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [siblings, setSiblings] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedInstallments, setSelectedInstallments] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [lastReceiptNo, setLastReceiptNo] = useState(null);

  // Print via popup window (logic lives in utils/printReceipt.js to avoid JSX parser issues)
  const doPrint = useCallback((data) => {
    setPrintData(data);
    printReceiptPopup(data);
  }, []);

  const [paidAmount, setPaidAmount] = useState('');
  const [manualDiscount, setManualDiscount] = useState('');

  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [schoolReceiptNo, setSchoolReceiptNo] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [keepDetails, setKeepDetails] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/api/students/classes').then(r => setClassList(r.data || [])).catch(() => {});
  }, []);

  const loadStudent = (studentData) => {
    setActiveStudent(studentData);
    const built = buildInstallments(studentData.monthly_dues || []);
    setInstallments(built);
    setSelectedInstallments([]);
    setPaidAmount('');
    setManualDiscount('');
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
    setSelectedInstallments(prev => {
      const exists = prev.find(p => p.monthName === inst.monthName);
      let next = [];
      if (exists) next = prev.filter(p => p.monthName !== inst.monthName);
      else next = [...prev, inst];
      
      const totalDue = next.reduce((sum, item) => sum + Math.max(0, item.netPayable - item.totalPaid), 0);
      setPaidAmount(String(totalDue));
      setManualDiscount('');
      setError('');
      setSuccess('');
      return next;
    });
  };
  
  const handleEqualClick = () => {
    if (selectedInstallments.length === 0) return;
    const discount = parseFloat(manualDiscount || 0);
    const totalNetPayable = selectedInstallments.reduce((sum, i) => sum + i.netPayable, 0);
    const totalPaidBefore = selectedInstallments.reduce((sum, i) => sum + i.totalPaid, 0);
    const due = Math.max(0, totalNetPayable - totalPaidBefore - discount);
    setPaidAmount(String(due));
  };

  const currentPayment = parseFloat(paidAmount || 0);
  const currentDiscount = parseFloat(manualDiscount || 0);
  
  const totalSelectedNetPayable = selectedInstallments.reduce((sum, i) => sum + i.netPayable, 0);
  const totalSelectedPaidBefore = selectedInstallments.reduce((sum, i) => sum + i.totalPaid, 0);
  const totalSelectedAmountTotal = selectedInstallments.reduce((sum, i) => sum + i.amountTotal, 0);
  const totalSelectedConcession = selectedInstallments.reduce((sum, i) => sum + i.concession, 0);

  const dueAfterPayment = selectedInstallments.length > 0 
    ? Math.max(0, totalSelectedNetPayable - totalSelectedPaidBefore - currentPayment - currentDiscount) 
    : 0;

  const grandTotalDue = installments.reduce((s, i) => s + i.netPayable, 0);
  const grandTotalPaid = installments.reduce((s, i) => s + i.totalPaid, 0);
  const grandBalance = grandTotalDue - grandTotalPaid;
  const currentDue = installments.find(i => i.status !== 'PAID')?.netPayable || 0;

  const handleTakeFee = async () => {
    if (!activeStudent || !activeStudent.adm_no) { setError('Select a valid student first.'); return; }
    if (selectedInstallments.length === 0) { setError('Select at least one installment from the list.'); return; }
    if (!paymentMode) { setError('Select a payment mode.'); return; }
    if (currentPayment <= 0) { setError('Enter a valid payment amount.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/fees/collect', {
        student_id: activeStudent.adm_no,
        amount: currentPayment,
        discount: currentDiscount,
        months: selectedInstallments.map(i => i.monthName),
        payment_mode: paymentMode,
        payment_date: paymentDate,
        notes: paymentNote,
        receipt_no: schoolReceiptNo || undefined,
      });

      const newReceiptNo = response?.data?.receipt_no || response?.receipt_no;
      setSuccess(`✅ Fee collected! Receipt No: ${newReceiptNo || 'Generated'}`);
      setLastReceiptNo(newReceiptNo);

      const refreshed = await api.get(`/api/students/adm/${activeStudent.adm_no}?academicYear=${selectedAcademicYear}`);
      loadStudent(refreshed.data);

      if (!keepDetails) {
        setPaymentNote('');
        setSchoolReceiptNo('');
        setPaymentMode('Cash');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setManualDiscount('');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to collect fee.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedInstallments([]);
    setPaidAmount('');
    setManualDiscount('');
    setPaymentNote('');
    setSchoolReceiptNo('');
    setPaymentMode('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setSuccess('');
    setLastReceiptNo(null);
  };

  const handlePrint = async (receiptNo, e) => {
    if (e) e.stopPropagation();
    if (!receiptNo) {
      setError('No receipt number found for this installment.');
      return;
    }
    try {
      setLoading(true);
      // api.get() returns the raw JSON from server: { data: { ...receiptFields } }
      const res = await api.get(`/api/fees/receipt/${receiptNo}`);
      const receiptPayload = res?.data || res;
      if (!receiptPayload) {
        setError('Receipt data is empty. Please try again.');
        return;
      }
      doPrint(receiptPayload);
    } catch (err) {
      setError(`Failed to fetch receipt: ${err.message || 'Unknown error'}. Check if receipt exists.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintEstimate = () => {
    if (!activeStudent) return;
    
    let targetInstallments = selectedInstallments;
    if (targetInstallments.length === 0) {
      targetInstallments = installments.filter(i => (i.netPayable - i.totalPaid) > 0);
    }
    if (targetInstallments.length === 0) {
      targetInstallments = installments;
    }
    if (targetInstallments.length === 0) {
      setError("No fee installments available to print.");
      return;
    }

    const estimateData = {
      receipt_no: 'ESTIMATE',
      created_at: new Date(),
      student_id: activeStudent.adm_no,
      class_name: activeStudent.class_name,
      student_name: activeStudent.name,
      father_name: activeStudent.father_name || '-',
      payment_mode: 'DUE SLIP',
      months_covered: targetInstallments.map(i => i.monthName).join(', '),
      tuition_amount: targetInstallments.reduce((sum, i) => sum + parseFloat(i.tuition_due || 0), 0) - targetInstallments.reduce((sum, i) => sum + parseFloat(i.tuition_paid || 0), 0),
      transport_amount: targetInstallments.reduce((sum, i) => sum + parseFloat(i.transport_due || 0), 0) - targetInstallments.reduce((sum, i) => sum + parseFloat(i.transport_paid || 0), 0),
      admission_amount: targetInstallments.reduce((sum, i) => sum + parseFloat(i.admission_fee_due || 0), 0) - targetInstallments.reduce((sum, i) => sum + parseFloat(i.admission_fee_paid || 0), 0),
      annual_amount: targetInstallments.reduce((sum, i) => sum + parseFloat(i.annual_fee_due || 0), 0) - targetInstallments.reduce((sum, i) => sum + parseFloat(i.annual_fee_paid || 0), 0),
      id_card_amount: targetInstallments.reduce((sum, i) => sum + parseFloat(i.id_card_due || 0), 0) - targetInstallments.reduce((sum, i) => sum + parseFloat(i.id_card_paid || 0), 0),
      exam_amount: targetInstallments.reduce((sum, i) => sum + parseFloat(i.exam_fee_due || 0), 0) - targetInstallments.reduce((sum, i) => sum + parseFloat(i.exam_fee_paid || 0), 0),
      other_amount: targetInstallments.reduce((sum, i) => sum + parseFloat(i.other_due || 0), 0) - targetInstallments.reduce((sum, i) => sum + parseFloat(i.other_paid || 0), 0),
      concession: targetInstallments.reduce((sum, i) => sum + parseFloat(i.concession || 0), 0),
      amount: targetInstallments.reduce((sum, i) => sum + i.netPayable, 0) - targetInstallments.reduce((sum, i) => sum + i.totalPaid, 0)
    };
    doPrint(estimateData);
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
        <div style={{ width: 420, flexShrink: 0 }}>
          {/* Search */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="Adm No" value={admNo}
                onChange={e => setAdmNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStudent()}
                style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 8px', fontSize: 13 }} />
              <select value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setSelectedStudentAdm(''); setActiveStudent(null); setInstallments([]); }}
                style={{ width: 110, border: '1px solid #d1d5db', borderRadius: 4, padding: '6px', fontSize: 13 }}>
                <option value="">Class</option>
                {classList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={selectedStudentAdm} onChange={handleStudentSelect} disabled={!selectedClass}
                style={{ width: 140, border: '1px solid #d1d5db', borderRadius: 4, padding: '6px', fontSize: 13 }}>
                <option value="">Student</option>
                {studentsInClass.map(s => <option key={s.adm_no} value={s.adm_no}>{s.name}</option>)}
              </select>
            </div>

            {activeStudent && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <StatChip label="Total Paids" value={fmt(grandTotalPaid)} color="#22c55e" />
                <StatChip label="Current Due" value={fmt(currentDue)} color="#38bdf8" />
                <StatChip label="Total Due" value={fmt(grandBalance)} color="#f97316" />
                <StatChip label="Refund Amount" value="₹0" color="#ef4444" />
                <StatChip label="Voucher Due" value="₹0" color="#64748b" />
              </div>
            )}

            {activeStudent && (
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn icon={<QrCode size={13}/>} label="Download QR" color="#e5e7eb" textColor="#374151" />
                <ActionBtn icon={<Printer size={13}/>} label="" color="#fee2e2" textColor="#ef4444" />
                <ActionBtn icon={<UserCircle size={13}/>} label="Student" color="#4f46e5" textColor="#fff" />
              </div>
            )}
          </div>

          {/* Sibling Details */}
          {activeStudent && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 12 }}>
              <div style={{ padding: '8px 12px', fontWeight: 600, fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #e5e7eb' }}>
                <UserCircle size={16} style={{ color: '#f59e0b' }} /> Sibling Details
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Name','Class','Roll Number','Adm. Number','Action'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {siblings.length === 0
                    ? <tr><td colSpan={5} style={{ padding: 12, color: '#9ca3af', textAlign: 'center' }}>No siblings linked</td></tr>
                    : siblings.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={tdS}>{s.name}</td>
                        <td style={tdS}>{s.class_name}</td>
                        <td style={tdS}>{s.roll_no || '-'}</td>
                        <td style={tdS}>{s.adm_no}</td>
                        <td style={tdS}><button style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}><Edit2 size={11}/></button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Details */}
          {activeStudent && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCircle size={18} style={{ color: '#f59e0b' }} />
                <b style={{ fontSize: 14, color: '#4b5563' }}>Details</b>
                <span style={{ color: '#3b82f6', cursor: 'pointer', fontSize: 12 }} onClick={() => setShowDetails(v => !v)}>
                  {showDetails ? 'hide' : 'show'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  <span style={{ fontSize: 14 }}>☷</span> Follow up
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  <span style={{ fontSize: 14 }}>+</span> Add Notes
                </button>
              </div>
            </div>
          )}
          {showDetails && activeStudent && (
             <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: 10, marginBottom: 12, fontSize: 12, color: '#4b5563' }}>
                Name: {activeStudent.name} | Class: {activeStudent.class_name} | Adm No: {activeStudent.adm_no}
             </div>
          )}

          {/* Installments Table */}
          {activeStudent && installments.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#38bdf8', color: '#fff', fontWeight: 600, fontSize: 12 }}>
                Installment <span style={{ background: '#f97316', borderRadius: 10, padding: '2px 8px', fontSize: 11 }}>{installments.length}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ ...thS, width: 30, textAlign: 'center' }}>Sr.</th>
                    <th style={thS}>Title</th>
                    <th style={thS}>Details</th>
                    <th style={{ ...thS, textAlign: 'center' }}><span style={{ background: '#f97316', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>Print / Cancel</span></th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst, idx) => {
                    const isPaid = inst.status === 'PAID';
                    const isSelected = selectedInstallments.some(p => p.monthName === inst.monthName);
                    
                    return (
                      <tr key={inst.monthName}
                        onClick={() => handleInstallmentClick(inst)}
                        style={{
                          cursor: isPaid ? 'default' : 'pointer',
                          background: isPaid ? '#dcfce7' : isSelected ? '#e0e7ff' : '#fff',
                          borderBottom: '1px solid #e5e7eb',
                        }}>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#4b5563' }}>
                          {isPaid ? inst.sr : (
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              readOnly 
                              style={{ cursor: 'pointer' }} 
                            />
                          )}
                        </td>
                        <td style={{ ...tdS, fontWeight: 500, color: '#1f2937' }}>
                          {inst.title}
                        </td>
                        <td style={{ ...tdS, color: '#4b5563' }}>
                          Payable = {inst.netPayable} 
                          {isPaid ? ` Paid = ${inst.totalPaid} , Due = 0` : ''}
                        </td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          {isPaid && (
                            <button onClick={e => handlePrint(inst.receiptNo, e)} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}>
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
          {activeStudent && installments.length === 0 && (
             <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                <p style={{ fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>No fee installments generated.</p>
                <p>Go to <strong>Fee Structure Setup</strong> and click <strong>Apply</strong> for {activeStudent.class_name} to generate monthly dues.</p>
             </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', margin: 0 }}>Fee Structure</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ color: '#4f46e5', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Get Help</span>
              <button 
                onClick={() => {
                  if (lastReceiptNo) {
                    handlePrint(lastReceiptNo);
                  } else {
                    handlePrintEstimate();
                  }
                }}
                style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                title="Print Due Slip / Receipt"
              >
                <Printer size={14} /> <span style={{fontSize: 11, fontWeight: 600}}>Print</span>
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Title</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Payable</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Paid</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Due</th>
                </tr>
              </thead>
              <tbody>
                {selectedInstallments.length > 0 ? (
                  (() => {
                    const combinedHeads = {};
                    selectedInstallments.forEach(inst => {
                      inst.heads.forEach(h => {
                        if (!combinedHeads[h.label]) combinedHeads[h.label] = { label: h.label, payable: 0, paid: 0, key: h.key };
                        combinedHeads[h.label].payable += h.payable;
                        combinedHeads[h.label].paid += h.paid;
                      });
                    });
                    return Object.values(combinedHeads).map((h) => {
                      const due = Math.max(0, h.payable - h.paid);
                      return (
                        <tr key={h.key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', color: '#4b5563' }}>{h.label}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4b5563' }}>{h.payable}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: h.paid > 0 ? '#16a34a' : '#4b5563' }}>{h.paid}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: due > 0 ? '#ef4444' : '#16a34a' }}>{due}</td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      ← Click an installment from the left panel
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Summary Block */}
            {selectedInstallments.length > 0 && (
              <div style={{ background: '#f9fafb', padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  <span>Amount</span>
                  <span>{totalSelectedAmountTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  <span>Concession</span>
                  <span>{totalSelectedConcession}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                  <span>Payable(Amount - Concession)</span>
                  <span>{totalSelectedNetPayable}</span>
                </div>
              </div>
            )}

            {/* Payment Entry Form */}
            {selectedInstallments.length > 0 && (
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ color: '#4f46e5', fontSize: 12, fontWeight: 500 }}>
                    Hit "ENTER" or Equal(=) button after entering "Paid" amount / <br/>भुगतान राशि दर्ज करने के बाद एंटर या समान (=) बटन दबाएं
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>Discount</span>
                      <input 
                        type="number" 
                        value={manualDiscount}
                        onChange={e => setManualDiscount(e.target.value)}
                        placeholder="₹0"
                        style={{ width: 80, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, textAlign: 'right', fontSize: 14 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>Paid</span>
                      <input 
                        type="number" 
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEqualClick()}
                        style={{ width: 100, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, textAlign: 'right', fontSize: 14 }}
                      />
                      <button onClick={handleEqualClick} style={{ background: '#84cc16', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>=</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                    Due (Payable - Paid) &nbsp;&nbsp;&nbsp; <span style={{ color: '#ef4444' }}>{dueAfterPayment}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={lblS}>Payment Mode<span style={{color:'red'}}>*</span></label>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={inpS}>
                      <option>Cash</option><option>Cheque</option><option>UPI</option>
                      <option>Card</option><option>Bank Transfer</option><option>Online</option>
                    </select>
                  </div>
                  <div>
                    <label style={lblS}>Payment Date<span style={{color:'red'}}>*</span></label>
                    <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inpS} />
                  </div>
                  <div>
                    <input type="text" placeholder="School Receipt No" value={schoolReceiptNo} onChange={e => setSchoolReceiptNo(e.target.value)} style={inpS} />
                  </div>
                  <div>
                    <input type="text" placeholder="Payment Note" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} style={inpS} />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1f2937', marginBottom: 16, cursor: 'pointer', fontWeight: 600 }}>
                  <input type="checkbox" checked={keepDetails} onChange={e => setKeepDetails(e.target.checked)} style={{ width: 14, height: 14 }} />
                  Keep same payment detail for the next fee payment
                </label>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 13 }}>{error}</div>}
                {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 13 }}>{success}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {lastReceiptNo && (
                    <button onClick={() => handlePrint(lastReceiptNo)} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Printer size={14} /> Print Receipt
                    </button>
                  )}
                  <button onClick={handleTakeFee} disabled={loading}
                    style={{ background: '#4c1d95', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Processing...' : 'Take Fee'}
                  </button>
                  <button onClick={handleReset} style={{ background: '#f9fafb', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 4, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Hidden receipt area — rendered off-screen so we can grab innerHTML */}
      <div
        ref={printRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '800px',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <ReceiptPrint receiptData={printData} />
      </div>
    </div>
  );
};

const StatChip = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', minWidth: 70 }}>
    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 2, fontWeight: 500 }}>{label}</div>
    <div style={{ background: color, color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>{value}</div>
  </div>
);

const ActionBtn = ({ icon, label, color, textColor, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, background: color, color: textColor, border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
    {icon}{label}
  </button>
);

const thS = { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 };
const tdS = { padding: '8px 12px', fontSize: 12 };
const lblS = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inpS = { width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: '8px 12px', fontSize: 13, boxSizing: 'border-box' };

export default FeePayment;
