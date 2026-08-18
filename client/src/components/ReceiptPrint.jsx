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
          .border-bottom { border-bottom: 1px solid #ccc; padding-bottom: 2px; }
          .receipt-table th, .receipt-table td { border: 1px solid #ccc; padding: 4px 8px; font-size: 13px; }
          .receipt-table th { background-color: #f3f4f6; text-align: center; font-weight: bold; }
        `}
      </style>
      
      <div id="printable-receipt-container">
        <div id="printable-receipt" style={{ padding: '10px', maxWidth: '800px', margin: '0 auto', border: '1px dashed #ccc' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            {/* Logo Placeholder */}
            <div style={{ width: '100px', height: '80px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>
              <span style={{ fontSize: '10px', color: '#999' }}>Logo</span>
            </div>
            
            {/* Center Text */}
            <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>New Sainik Public School</h1>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>State Board Of Uttar Pradesh (2026-2027)</p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>New Sainik Public School Siyarpakha, Gudha Kalan, Naraini, Banda, U.P. 210129</p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>7887299111, 9198343345, inquiry@newsainikpublicschool.in</p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>Affiliation No: EJ-6/18-19 UDISE Code: 09400405918</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>Fee Receipt - 2026-2027 <span style={{ fontSize: '12px', fontWeight: 'normal' }}>(Student Copy)</span></p>
            </div>

            {/* QR Placeholder */}
            <div style={{ width: '80px', height: '80px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>
              <span style={{ fontSize: '10px', color: '#999' }}>QR Code</span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 90px 1fr 90px 1fr', gap: '8px 10px', fontSize: '13px', marginBottom: '15px', alignItems: 'end' }}>
            <div style={{ fontWeight: 'bold' }}>Adm.No.</div>
            <div className="border-bottom">{receiptData.student_id}</div>
            
            <div style={{ fontWeight: 'bold' }}>Receipt No.</div>
            <div className="border-bottom">{receiptData.receipt_no}</div>
            
            <div style={{ fontWeight: 'bold' }}>Scl.Receipt No.</div>
            <div className="border-bottom"></div>

            <div style={{ fontWeight: 'bold' }}>S.Name</div>
            <div className="border-bottom" style={{ fontWeight: 'bold' }}>{receiptData.student_name}</div>
            
            <div style={{ fontWeight: 'bold' }}>Receipt/TXN Date</div>
            <div className="border-bottom">{new Date(receiptData.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            
            <div style={{ fontWeight: 'bold' }}>Pay.Mode</div>
            <div className="border-bottom">{receiptData.payment_mode}</div>

            <div style={{ fontWeight: 'bold' }}>F.Name</div>
            <div className="border-bottom">{receiptData.father_name || '-'}</div>
            
            <div style={{ fontWeight: 'bold' }}>Class</div>
            <div className="border-bottom" style={{ fontWeight: 'bold' }}>{receiptData.class_name}</div>
            
            <div style={{ fontWeight: 'bold' }}>Roll.No.</div>
            <div className="border-bottom"></div>
          </div>
          
          <div style={{ display: 'flex', fontSize: '13px', marginBottom: '20px', alignItems: 'end' }}>
            <div style={{ fontWeight: 'bold', width: '70px' }}>Pay.Type</div>
            <div className="border-bottom" style={{ flex: 1 }}>Payment for {receiptData.months_covered}</div>
          </div>

          {/* Table */}
          <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Fee Type</th>
                <th>Due Amount (Rs.)</th>
                <th>Paid Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tuition Fee</td>
                <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.tuition_amount || 0)}</td>
                <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.tuition_amount || 0)}</td>
              </tr>
              <tr>
                <td>Transport</td>
                <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.transport_amount || 0)}</td>
                <td style={{ textAlign: 'right' }}>{parseFloat(receiptData.transport_amount || 0)}</td>
              </tr>
              {parseFloat(receiptData.concession || 0) > 0 && (
                <tr>
                  <td>Discount</td>
                  <td style={{ textAlign: 'right' }}>0</td>
                  <td style={{ textAlign: 'right' }}>-{parseFloat(receiptData.concession || 0)}</td>
                </tr>
              )}
              <tr>
                <td style={{ fontWeight: 'bold' }}>Total Amount</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(receiptData.amount || 0)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(receiptData.amount || 0)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Payable</td>
                <td style={{ borderBottom: 'none' }}></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(receiptData.amount || 0)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Paid</td>
                <td style={{ borderTop: 'none', borderBottom: 'none' }}></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(receiptData.amount || 0)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Due</td>
                <td style={{ borderTop: 'none' }}></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>0</td>
              </tr>
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
