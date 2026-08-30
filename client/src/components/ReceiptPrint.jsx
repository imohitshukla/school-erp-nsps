import React from 'react';

const ReceiptPrint = ({ receiptData }) => {
  if (!receiptData) return null;

  const fmtDate = (d) => {
    if (!d) return new Date().toLocaleString('en-IN');
    const date = new Date(d);
    if (isNaN(date)) return String(d);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const fmtRupee = (amt) => {
    const val = parseFloat(amt || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- Compute totals ---
  const paidAmt       = parseFloat(receiptData.amount || 0);
  const concession    = parseFloat(receiptData.concession || 0);

  // Detailed fee heads
  const tuitionPaid   = parseFloat(receiptData.tuition_amount   || 0);
  const transportPaid = parseFloat(receiptData.transport_amount || 0);
  const otherPaid     = parseFloat(receiptData.other_amount     || 0);
  const admissionPaid = parseFloat(receiptData.admission_amount || 0);
  const annualPaid    = parseFloat(receiptData.annual_amount    || 0);
  const idCardPaid    = parseFloat(receiptData.id_card_amount   || 0);
  const examPaid      = parseFloat(receiptData.exam_amount      || 0);

  // totalFeeDue is the gross (before concession) fee for the months on this receipt
  const totalFeeDue   = parseFloat(receiptData.total_fee_amount || 0) ||
    (tuitionPaid + transportPaid + otherPaid + admissionPaid + annualPaid + idCardPaid + examPaid + concession);

  const netPayable    = Math.max(0, totalFeeDue - concession);
  const remainingDue  = parseFloat(receiptData.remaining_due !== undefined ? receiptData.remaining_due : Math.max(0, netPayable - paidAmt));

  // Fee heads to display (filter out zero rows)
  const feeHeads = [
    { label: 'Tuition Fee',              amount: tuitionPaid   },
    { label: 'Transport Fee',            amount: transportPaid },
    { label: 'Admission Fee',            amount: admissionPaid },
    { label: 'Annual / Development Fee', amount: annualPaid    },
    { label: 'ID Card Fee',              amount: idCardPaid    },
    { label: 'Board / Exam Fee',         amount: examPaid      },
    { label: 'Other Charges',            amount: otherPaid     },
  ].filter(h => h.amount > 0);

  const monthsCovered = receiptData.months_covered || receiptData.month_paid || 'Fee Payment';

  return (
    <div ref={ref}>
      <style>{`
        @media print {
          @page { margin: 8mm; size: A4; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
        .rp-wrap {
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          background: #fff;
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #1a1a2e;
          border-radius: 6px;
          box-sizing: border-box;
        }
        /* HEADER */
        .rp-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border-bottom: 3px double #1a1a2e;
          padding-bottom: 16px;
          margin-bottom: 18px;
        }
        .rp-logo { width: 80px; height: 80px; object-fit: contain; flex-shrink: 0; }
        .rp-school-info { flex: 1; text-align: center; }
        .rp-school-name { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
        .rp-school-sub  { font-size: 12px; margin: 0 0 2px; color: #333; }
        .rp-building { width: 110px; height: 80px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        /* RECEIPT TITLE BANNER */
        .rp-title-banner {
          text-align: center;
          background: #1a1a2e;
          color: #fff;
          font-size: 15px;
          font-weight: bold;
          letter-spacing: 3px;
          text-transform: uppercase;
          padding: 6px;
          margin-bottom: 18px;
          border-radius: 3px;
        }
        /* INFO GRID */
        .rp-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 20px;
          margin-bottom: 18px;
          font-size: 13px;
          border: 1px solid #ddd;
          padding: 10px 14px;
          border-radius: 4px;
          background: #fafafa;
        }
        .rp-info-row { display: flex; gap: 6px; }
        .rp-info-label { font-weight: bold; min-width: 115px; color: #444; white-space: nowrap; }
        .rp-info-value { color: #111; }
        /* FEE TABLE */
        .rp-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .rp-table th {
          background: #1a1a2e;
          color: #fff;
          padding: 8px 12px;
          text-align: left;
          font-size: 13px;
        }
        .rp-table th.right { text-align: right; }
        .rp-table td { border: 1px solid #ccc; padding: 7px 12px; }
        .rp-table td.right { text-align: right; }
        .rp-table tr:nth-child(even) td { background: #f9f9f9; }
        .rp-table .summary-row td { border-top: 2px solid #666; font-weight: bold; background: #f0f0f0; }
        .rp-table .paid-row td { color: #16a34a; font-weight: bold; background: #f0fff4; }
        .rp-table .due-row td { color: #dc2626; font-weight: bold; background: #fff1f1; }
        /* FOOTER */
        .rp-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 30px;
          font-size: 12px;
          color: #555;
        }
        .rp-sig { text-align: center; }
        .rp-sig-line { width: 180px; border-top: 1px solid #000; margin-bottom: 6px; }
        .rp-sig-name { font-weight: bold; font-size: 13px; color: #000; }
        .rp-watermark-note { font-style: italic; font-size: 11px; }
      `}</style>

      <div className="rp-wrap">
        {/* === HEADER === */}
        <div className="rp-header">
          <img
            src="/new_logo.jpg"
            alt="School Logo"
            className="rp-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="rp-school-info">
            <p className="rp-school-name">New Sainik Public School</p>
            <p className="rp-school-sub">Siyarpakha, Gudha Kalan, Naraini, Banda, U.P. – 210129</p>
            <p className="rp-school-sub">📞 7887299111, 9198343345 &nbsp;|&nbsp; ✉ inquiry@newsainikpublicschool.in</p>
            <p className="rp-school-sub">Affiliation No: EJ-6/18-19 &nbsp;|&nbsp; UDISE Code: 09400405918</p>
            <p className="rp-school-sub">State Board of Uttar Pradesh &nbsp;|&nbsp; Academic Year: 2026-2027</p>
          </div>
          <img
            src="/new_building.jpg"
            alt="School Building"
            className="rp-building"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* === TITLE BANNER === */}
        <div className="rp-title-banner">Fee Receipt – Student Copy</div>

        {/* === RECEIPT + STUDENT INFO === */}
        <div className="rp-info-grid">
          <div>
            <div className="rp-info-row">
              <span className="rp-info-label">Receipt No:</span>
              <span className="rp-info-value" style={{ fontWeight: 'bold' }}>{receiptData.receipt_no || '—'}</span>
            </div>
            <div className="rp-info-row">
              <span className="rp-info-label">Date &amp; Time:</span>
              <span className="rp-info-value">{fmtDate(receiptData.created_at)}</span>
            </div>
            <div className="rp-info-row">
              <span className="rp-info-label">Payment Mode:</span>
              <span className="rp-info-value">{receiptData.payment_mode || 'Cash'}</span>
            </div>
            <div className="rp-info-row">
              <span className="rp-info-label">Handled By:</span>
              <span className="rp-info-value">{receiptData.collected_by || 'Admin'}</span>
            </div>
          </div>
          <div>
            <div className="rp-info-row">
              <span className="rp-info-label">Student Name:</span>
              <span className="rp-info-value" style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{receiptData.student_name || '—'}</span>
            </div>
            <div className="rp-info-row">
              <span className="rp-info-label">Admission No:</span>
              <span className="rp-info-value">{receiptData.student_id || '—'}</span>
            </div>
            <div className="rp-info-row">
              <span className="rp-info-label">Class:</span>
              <span className="rp-info-value" style={{ fontWeight: 'bold' }}>{receiptData.class_name || '—'}</span>
            </div>
            <div className="rp-info-row">
              <span className="rp-info-label">Father's Name:</span>
              <span className="rp-info-value" style={{ textTransform: 'uppercase' }}>{receiptData.father_name || '—'}</span>
            </div>
          </div>
        </div>

        {/* Months covered */}
        <div style={{ fontSize: '13px', marginBottom: '16px', padding: '6px 14px', border: '1px solid #ddd', borderRadius: 4, background: '#f5f5ff' }}>
          <strong>Fee for:</strong> {monthsCovered}
        </div>

        {/* === FEE BREAKDOWN TABLE === */}
        <table className="rp-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Sr.</th>
              <th>Description</th>
              <th className="right" style={{ width: '160px' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {feeHeads.length > 0 ? (
              feeHeads.map((h, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{i + 1}</td>
                  <td>{h.label}</td>
                  <td className="right">{fmtRupee(h.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                  Fee payment recorded
                </td>
              </tr>
            )}

            {/* Summary rows */}
            {totalFeeDue > 0 && (
              <tr className="summary-row">
                <td colSpan={2}>Total Fee Amount</td>
                <td className="right">{fmtRupee(totalFeeDue)}</td>
              </tr>
            )}
            {concession > 0 && (
              <tr className="summary-row">
                <td colSpan={2}>Concession / Discount</td>
                <td className="right" style={{ color: '#2563eb' }}>({fmtRupee(concession)})</td>
              </tr>
            )}
            {totalFeeDue > 0 && (
              <tr className="summary-row">
                <td colSpan={2}>Net Payable</td>
                <td className="right">{fmtRupee(netPayable)}</td>
              </tr>
            )}
            <tr className="paid-row">
              <td colSpan={2}>✅ Amount Paid</td>
              <td className="right">{fmtRupee(paidAmt)}</td>
            </tr>
            <tr className="due-row">
              <td colSpan={2}>🔴 Remaining Due</td>
              <td className="right">{fmtRupee(remainingDue)}</td>
            </tr>
          </tbody>
        </table>

        {/* === FOOTER === */}
        <div className="rp-footer">
          <div className="rp-watermark-note">
            ⚠ This is a computer-generated receipt. No signature required.
            {receiptData.notes && <span><br />Note: {receiptData.notes}</span>}
          </div>
          <div className="rp-sig">
            <div className="rp-sig-line"></div>
            <div className="rp-sig-name">Authorized Signatory</div>
            <div style={{ fontSize: '11px', color: '#666' }}>New Sainik Public School</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceiptPrint;
