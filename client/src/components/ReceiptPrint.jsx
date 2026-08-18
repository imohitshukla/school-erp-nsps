import React from 'react';

const ReceiptPrint = React.forwardRef(({ receiptData }, ref) => {
  if (!receiptData) return null;

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
  };

  const fmtAmt = (amt) => {
    const val = parseFloat(amt || 0);
    return val > 0 ? val.toLocaleString('en-IN', { minimumFractionDigits: 0 }) : '0';
  };

  const totalPaidAmt = parseFloat(receiptData.amount || 0);
  const concessionAmt = parseFloat(receiptData.concession || 0);
  const payableAmt = receiptData.payable_amount || (totalPaidAmt + concessionAmt); 
  const finalDueAmt = receiptData.remaining_due || 0; 
  
  const paymentTypeDesc = receiptData.months_covered 
    ? `Payment for ${receiptData.months_covered}` 
    : receiptData.month_paid 
      ? `Payment for ${receiptData.month_paid}`
      : 'Fee Payment';

  return (
    <div ref={ref} style={{ padding: '0px', fontFamily: '"Times New Roman", Times, serif', color: '#000', background: '#fff', width: '100%' }}>
      <style>
        {`
          @media screen {
            #printable-receipt-container { display: none; }
          }
          @media print {
            body * { visibility: hidden; }
            #printable-receipt-container, #printable-receipt-container * { visibility: visible; }
            #printable-receipt-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
            @page { margin: 5mm; }
          }
          .val-underline { border-bottom: 1px solid #ccc; display: inline-block; min-width: 100px; padding: 0 4px; }
          .receipt-table th, .receipt-table td { border: 1px solid #999; padding: 6px 10px; font-size: 14px; }
          .receipt-table th { font-weight: bold; }
          .info-grid { display: grid; grid-template-columns: auto 1fr auto 1fr auto 1fr; gap: 8px 15px; align-items: end; margin-bottom: 15px; font-size: 14px; }
          .info-label { font-weight: bold; white-space: nowrap; }
          .info-val { border-bottom: 1px solid #999; padding-bottom: 2px; }
        `}
      </style>
      
      <div id="printable-receipt-container">
        <div id="printable-receipt" style={{ padding: '20px', maxWidth: '850px', margin: '0 auto', border: '1px solid #fff' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ width: '120px', height: '90px' }}>
              <img src="/logo.png" alt="School" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
            
            <div style={{ textAlign: 'center', flex: 1, padding: '0 15px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#333' }}>New Sainik Public School</h1>
              <p style={{ margin: '2px 0', fontSize: '15px' }}>State Board Of Uttar Pradesh (2026-2027)</p>
              <p style={{ margin: '2px 0', fontSize: '14px' }}>New Sainik Public School Siyarpakha, Gudha Kalan, Naraini, Banda, U.P. 210129</p>
              <p style={{ margin: '2px 0', fontSize: '14px' }}>7887299111, 9198343345, inquiry@newsainikpublicschool.in</p>
              <p style={{ margin: '2px 0', fontSize: '14px' }}>Affiliation No: EJ-6/18-19 UDISE Code: 09400405918</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '15px' }}>Fee Receipt - 2026-2027 (Student Copy)</p>
            </div>

            <div style={{ width: '100px', textAlign: 'right' }}>
              <div style={{ width: '100px', height: '100px', border: '1px solid #ccc', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#999' }}>QR CODE</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="info-grid">
            <div className="info-label">Adm.No.</div>
            <div className="info-val">{receiptData.student_id}</div>
            <div className="info-label">Receipt No.</div>
            <div className="info-val">{receiptData.receipt_no}</div>
            <div className="info-label">Scl.Receipt No.</div>
            <div className="info-val"></div>
            
            <div className="info-label">S.Name</div>
            <div className="info-val" style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{receiptData.student_name}</div>
            <div className="info-label">Receipt/TXN Date</div>
            <div className="info-val">{fmtDate(receiptData.created_at || Date.now())}</div>
            <div className="info-label">Pay.Mode</div>
            <div className="info-val">{receiptData.payment_mode}</div>
            
            <div className="info-label">F.Name</div>
            <div className="info-val" style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{receiptData.father_name || '-'}</div>
            <div className="info-label">Class</div>
            <div className="info-val" style={{ fontWeight: 'bold' }}>{receiptData.class_name}</div>
            <div className="info-label">Roll.No.</div>
            <div className="info-val"></div>
          </div>
          
          <div style={{ display: 'flex', fontSize: '14px', marginBottom: '20px', alignItems: 'end' }}>
            <div className="info-label" style={{ marginRight: '10px' }}>Pay.Type</div>
            <div className="info-val" style={{ flex: 1 }}>{paymentTypeDesc}</div>
          </div>
          
          {/* Table */}
          <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', background: 'transparent' }}>Fee Type</th>
                <th style={{ textAlign: 'right', background: 'transparent', width: '150px' }}>Due Amount (Rs.)</th>
                <th style={{ textAlign: 'right', background: 'transparent', width: '150px' }}>Paid Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {parseFloat(receiptData.annual_amount || 0) > 0 && (
                <tr><td>Annual Charge</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.annual_amount)}</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.annual_amount)}</td></tr>
              )}
              {parseFloat(receiptData.exam_amount || 0) > 0 && (
                <tr><td>Board Fee</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.exam_amount)}</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.exam_amount)}</td></tr>
              )}
              {parseFloat(receiptData.id_card_amount || 0) > 0 && (
                <tr><td>ID Card</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.id_card_amount)}</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.id_card_amount)}</td></tr>
              )}
              {parseFloat(receiptData.transport_amount || 0) > 0 && (
                <tr><td>Transport</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.transport_amount)}</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.transport_amount)}</td></tr>
              )}
              {parseFloat(receiptData.tuition_amount || 0) > 0 && (
                <tr><td>Tuition Fee</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.tuition_amount)}</td><td style={{ textAlign: 'right' }}>{fmtAmt(receiptData.tuition_amount)}</td></tr>
              )}
              
              <tr><td style={{ fontWeight: 'bold' }}>Total Amount</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmtAmt(payableAmt)}</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmtAmt(totalPaidAmt + concessionAmt)}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>Discount</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmtAmt(concessionAmt)}</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}></td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>Payable</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}></td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmtAmt(payableAmt - concessionAmt)}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>Paid</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}></td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmtAmt(totalPaidAmt)}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>Due</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}></td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmtAmt(finalDueAmt)}</td></tr>
            </tbody>
          </table>

          {/* Signatory */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '15px' }}>
            <div style={{ textAlign: 'center', marginRight: '20px' }}>
              <p style={{ margin: '0 0 5px 0' }}>{receiptData.collected_by || 'Admin'}</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Auth. Signatory</p>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', borderTop: '1px dashed #666', width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
});

export default ReceiptPrint;
