import React from 'react';

const ReceiptPrint = React.forwardRef(({ receiptData, schoolData }, ref) => {
  if (!receiptData) return null;

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff' }}>
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
        `}
      </style>
      
      <div id="printable-receipt-container">
        <div id="printable-receipt" style={{ border: '2px solid #000', padding: '20px', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', textTransform: 'uppercase' }}>{schoolData?.name || 'New Sainik Public School'}</h1>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>{schoolData?.address || 'School Address'}</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '18px', textDecoration: 'underline' }}>FEE RECEIPT</h2>
        </div>

        {/* Receipt Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '14px' }}>
          <div>
            <p style={{ margin: '4px 0' }}><strong>Receipt No:</strong> {receiptData.receipt_no}</p>
            <p style={{ margin: '4px 0' }}><strong>Date:</strong> {new Date(receiptData.created_at || Date.now()).toLocaleDateString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '4px 0' }}><strong>Academic Year:</strong> 2026-2027</p>
            <p style={{ margin: '4px 0' }}><strong>Payment Mode:</strong> {receiptData.payment_mode}</p>
          </div>
        </div>

        {/* Student Info */}
        <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '20px', fontSize: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><strong>Student Name:</strong> {receiptData.student_name}</div>
            <div><strong>Class:</strong> {receiptData.class_name}</div>
            <div><strong>Admission No:</strong> {receiptData.student_id}</div>
            <div><strong>Father's Name:</strong> {receiptData.father_name || '-'}</div>
          </div>
        </div>

        {/* Particulars */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Particulars</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                Fee Collection for Months: <br/><strong>{receiptData.months_covered}</strong>
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                {parseFloat(receiptData.amount || 0).toFixed(2)}
              </td>
            </tr>
            {parseFloat(receiptData.concession || 0) > 0 && (
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}><strong>Discount Applied</strong></td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>- {parseFloat(receiptData.concession).toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}><strong>Total Paid</strong></td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                {parseFloat(receiptData.amount || 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '14px' }}>
          <div>
            <p style={{ margin: 0 }}><strong>Note:</strong> {receiptData.notes || 'Thank you for the payment.'}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 40px 0' }}><strong>Authorized Signatory</strong></p>
            <p style={{ margin: 0 }}>______________________</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>{receiptData.collected_by}</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});

export default ReceiptPrint;
