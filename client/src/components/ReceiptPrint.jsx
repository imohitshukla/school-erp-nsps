import React from 'react';

const ReceiptPrint = React.forwardRef(({ receiptData, schoolData }, ref) => {
  if (!receiptData) return null;

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: '"Times New Roman", Times, serif', color: '#000', background: '#fff' }}>
      <style>
        {`
          @media screen {
            #printable-receipt-container { display: none; }
          }
          @media print {
            body * { visibility: hidden; }
            #printable-receipt-container, #printable-receipt-container * { visibility: visible; }
            #printable-receipt-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
            @page { margin: 10mm; }
          }
          .border-bottom { border-bottom: 1px solid #000; padding-bottom: 2px; }
          .receipt-table th, .receipt-table td { border: 1px solid #000; padding: 8px 12px; font-size: 14px; }
          .receipt-table th { background-color: #f3f4f6; text-align: center; font-weight: bold; }
        `}
      </style>
      
      <div id="printable-receipt-container">
        <div id="printable-receipt" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', border: '2px solid #000' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
            {/* Logo */}
            <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            
            {/* Center Text */}
            <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>New Sainik Public School</h1>
              <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 'bold' }}>Bajrang Chauraha, Siyarpakha Gudhankalan Naraini, Banda-210129</p>
              <p style={{ margin: '2px 0', fontSize: '13px' }}>7887299111, 9198343345 | inquiry@newsainikpublicschool.in</p>
              <p style={{ margin: '2px 0', fontSize: '13px' }}>Affiliation No: EJ-6/18-19 | UDISE Code: 09400405918</p>
            </div>

            {/* Empty right side placeholder for balance if needed */}
            <div style={{ width: '100px' }}></div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', border: '1px solid #000', padding: '5px 15px', textTransform: 'uppercase', borderRadius: '4px', letterSpacing: '1px' }}>Fee Receipt</span>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>(Student Copy)</div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 1fr', gap: '15px', fontSize: '14px', marginBottom: '25px', alignItems: 'end' }}>
            <div style={{ fontWeight: 'bold' }}>Receipt No.</div>
            <div className="border-bottom">{receiptData.receipt_no}</div>
            
            <div style={{ fontWeight: 'bold' }}>Receipt Date</div>
            <div className="border-bottom">{new Date(receiptData.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            
            <div style={{ fontWeight: 'bold' }}>Adm. No.</div>
            <div className="border-bottom">{receiptData.student_id}</div>
            
            <div style={{ fontWeight: 'bold' }}>Class</div>
            <div className="border-bottom" style={{ fontWeight: 'bold' }}>{receiptData.class_name}</div>

            <div style={{ fontWeight: 'bold' }}>Student Name</div>
            <div className="border-bottom" style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{receiptData.student_name}</div>
            
            <div style={{ fontWeight: 'bold' }}>Father's Name</div>
            <div className="border-bottom" style={{ textTransform: 'uppercase' }}>{receiptData.father_name || '-'}</div>

            <div style={{ fontWeight: 'bold' }}>Payment Mode</div>
            <div className="border-bottom">{receiptData.payment_mode}</div>

            <div style={{ fontWeight: 'bold' }}>Months Paid</div>
            <div className="border-bottom">{receiptData.months_covered || receiptData.month_paid}</div>
          </div>
          
          {/* Table */}
          <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', width: '60%' }}>Fee Particulars</th>
                <th>Amount Paid (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {parseFloat(receiptData.tuition_amount || 0) > 0 && (
                <tr>
                  <td>Tuition Fee</td>
                  <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.tuition_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              {parseFloat(receiptData.transport_amount || 0) > 0 && (
                <tr>
                  <td>Transport Fee</td>
                  <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.transport_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              {parseFloat(receiptData.admission_amount || 0) > 0 && (
                <tr>
                  <td>Admission Fee</td>
                  <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.admission_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              {parseFloat(receiptData.id_card_amount || 0) > 0 && (
                <tr>
                  <td>ID Card Fee</td>
                  <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.id_card_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              <tr>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Amount Paid:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(receiptData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>

              {parseFloat(receiptData.concession || 0) > 0 && (
                <tr>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Concession/Discount:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>- {parseFloat(receiptData.concession || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Signatory */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '13px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 5px 0' }}>{receiptData.collected_by || 'Admin'}</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Auth. Signatory</p>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', borderTop: '1px dashed #999' }}></div>

        </div>
      </div>
    </div>
  );
});

export default ReceiptPrint;
