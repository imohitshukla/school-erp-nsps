import React from 'react';

const ReceiptPrint = React.forwardRef(({ receiptData }, ref) => {
  if (!receiptData) return null;

  const fmtDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  const fmtAmt = (amt) => {
    const val = parseFloat(amt || 0);
    return val.toFixed(2);
  };

  // Extract totals based on the provided data or calculate from heads
  const totalPaidAmt = parseFloat(receiptData.amount || 0);
  const concessionAmt = parseFloat(receiptData.concession || 0);
  // Estimate data sometimes has a total amount calculated differently
  let totalFeeAmt = parseFloat(receiptData.total_fee_amount || 0);
  
  if (!totalFeeAmt && receiptData.tuition_amount !== undefined) {
    totalFeeAmt = parseFloat(receiptData.tuition_amount || 0) + 
                  parseFloat(receiptData.transport_amount || 0) + 
                  parseFloat(receiptData.admission_amount || 0) + 
                  parseFloat(receiptData.annual_amount || 0) + 
                  parseFloat(receiptData.id_card_amount || 0) + 
                  parseFloat(receiptData.exam_amount || 0) + 
                  parseFloat(receiptData.other_amount || 0) + concessionAmt;
  }
  
  if (!totalFeeAmt && receiptData.annual_amount) {
     totalFeeAmt = parseFloat(receiptData.annual_amount) + parseFloat(receiptData.exam_amount || 0) + parseFloat(receiptData.id_card_amount || 0) + parseFloat(receiptData.transport_amount || 0) + parseFloat(receiptData.tuition_amount || 0);
  }

  const netPayable = Math.max(0, totalFeeAmt - concessionAmt);
  const finalDueAmt = receiptData.remaining_due !== undefined ? receiptData.remaining_due : Math.max(0, netPayable - totalPaidAmt);

  return (
    <div ref={ref} style={{ padding: '0px', fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif', color: '#000', background: '#fff', width: '100%' }}>
      <style>
        {`
          @media print {
            @page { margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .receipt-container {
            position: relative;
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #1a202c;
            border-radius: 8px;
            padding: 40px;
            background: #fff;
            overflow: hidden;
            box-sizing: border-box;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70%;
            opacity: 0.05;
            pointer-events: none;
            z-index: 0;
          }
          .content-wrapper {
            position: relative;
            z-index: 1;
          }
          .header-section {
            text-align: center;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 28px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #111827;
            margin: 0 0 8px 0;
          }
          .school-code {
            font-size: 14px;
            color: #4b5563;
            margin: 0 0 16px 0;
          }
          .receipt-title {
            font-size: 20px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
            padding-bottom: 4px;
          }
          .top-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
            font-size: 14px;
            line-height: 1.5;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .info-group {
            display: flex;
            gap: 8px;
          }
          .info-label {
            font-weight: 600;
            min-width: 120px;
          }
          .info-value {
            color: #1f2937;
          }
          .student-info {
            margin-bottom: 30px;
            font-size: 15px;
            line-height: 1.8;
          }
          .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border: 1px solid #d1d5db;
          }
          .receipt-table th, .receipt-table td {
            border: 1px solid #d1d5db;
            padding: 12px 16px;
            font-size: 15px;
          }
          .receipt-table th {
            text-align: left;
            font-weight: 700;
            background-color: #f9fafb;
            color: #111827;
          }
          .receipt-table .amount-col {
            text-align: right;
            width: 200px;
          }
          .receipt-table td.font-bold {
            font-weight: 700;
          }
          .text-green { color: #16a34a; font-weight: 700; }
          .text-red { color: #dc2626; font-weight: 700; }
          
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
            font-size: 13px;
            color: #4b5563;
          }
          .signatory-box {
            text-align: center;
          }
          .signatory-line {
            width: 200px;
            border-top: 1px solid #000;
            margin-bottom: 8px;
          }
          .signatory-text {
            font-weight: 700;
            color: #000;
            font-size: 14px;
          }
          .header-images {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: absolute;
            top: 40px;
            left: 40px;
            right: 40px;
            z-index: 1;
          }
          .logo-img {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
          .building-img {
            width: 120px;
            height: 80px;
            object-fit: cover;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}
      </style>
      
      <div className="receipt-container">
        <img src="/logo.png" alt="Watermark" className="watermark" onError={(e) => e.target.style.display = 'none'} />
        
        <div className="header-images">
          <img src="/logo.png" alt="Logo" className="logo-img" onError={(e) => e.target.style.display = 'none'} />
          <img src="/building.jpeg" alt="Building" className="building-img" onError={(e) => e.target.style.display = 'none'} />
        </div>

        <div className="content-wrapper">
          {/* Header */}
          <div className="header-section">
            <h1 className="school-name">New Sainik Public School</h1>
            <p className="school-code">School Code: nsps</p>
            <h2 className="receipt-title">Fee Receipt</h2>
          </div>

          {/* Top Info Grid */}
          <div className="top-info-grid">
            <div>
              <div className="info-group">
                <span className="info-label">Receipt No:</span>
                <span className="info-value">{receiptData.receipt_no || 'N/A'}</span>
              </div>
              <div className="info-group" style={{ marginTop: '8px' }}>
                <span className="info-label">Date & Time:</span>
                <span className="info-value">{fmtDate(receiptData.created_at || Date.now())}</span>
              </div>
            </div>
            <div>
              <div className="info-group">
                <span className="info-label">Payment Mode:</span>
                <span className="info-value">{receiptData.payment_mode || 'Cash'}</span>
              </div>
              <div className="info-group" style={{ marginTop: '8px' }}>
                <span className="info-label">Handled By:</span>
                <span className="info-value">{receiptData.collected_by || 'admin1@school.com'}</span>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="student-info">
            <div className="info-group">
              <span className="info-label">Student Name:</span>
              <span className="info-value" style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{receiptData.student_name}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Admission No:</span>
              <span className="info-value">{receiptData.student_id}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Class & Section:</span>
              <span className="info-value">{receiptData.class_name}</span>
            </div>
          </div>

          {/* Fee Table */}
          <table className="receipt-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="amount-col">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Fee Amount</td>
                <td className="amount-col">{fmtAmt(totalFeeAmt)}</td>
              </tr>
              <tr>
                <td>Applied Concession</td>
                <td className="amount-col">{fmtAmt(concessionAmt)}</td>
              </tr>
              <tr>
                <td className="font-bold">Net Payable</td>
                <td className="amount-col font-bold">{fmtAmt(netPayable)}</td>
              </tr>
              <tr>
                <td className="font-bold text-green">Paid Amount</td>
                <td className="amount-col text-green">{fmtAmt(totalPaidAmt)}</td>
              </tr>
              <tr>
                <td className="font-bold text-red">Remaining Due</td>
                <td className="amount-col text-red">{fmtAmt(finalDueAmt)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="footer-section">
            <div style={{ fontStyle: 'italic' }}>
              * This is a computer-generated receipt.
            </div>
            <div className="signatory-box">
              <div className="signatory-line"></div>
              <div className="signatory-text">Authorized Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

export default ReceiptPrint;

