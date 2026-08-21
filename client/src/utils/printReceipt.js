/**
 * Generates a complete HTML string for a fee receipt and opens it in a popup window for printing.
 * Lives in a plain .js file to avoid JSX parser issues with <script> and </script> tags.
 */
export function printReceiptPopup(data) {
  if (!data) return;

  const fmtDate = (d) => {
    if (!d) return new Date().toLocaleString('en-IN');
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fmtR = (v) => {
    const n = parseFloat(v || 0);
    return '\u20b9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const paidAmt       = parseFloat(data.amount || 0);
  const concession    = parseFloat(data.concession || 0);
  const tuitionPaid   = parseFloat(data.tuition_amount   || 0);
  const transportPaid = parseFloat(data.transport_amount || 0);
  const otherPaid     = parseFloat(data.other_amount     || 0);
  const admissionPaid = parseFloat(data.admission_amount || 0);
  const annualPaid    = parseFloat(data.annual_amount    || 0);
  const idCardPaid    = parseFloat(data.id_card_amount   || 0);
  const examPaid      = parseFloat(data.exam_amount      || 0);

  const totalFeeDue = parseFloat(data.total_fee_amount || 0) ||
    (tuitionPaid + transportPaid + otherPaid + admissionPaid + annualPaid + idCardPaid + examPaid + concession);
  const netPayable  = Math.max(0, totalFeeDue - concession);
  const remaining   = parseFloat(
    data.remaining_due !== undefined ? data.remaining_due : Math.max(0, netPayable - paidAmt)
  );

  const feeHeads = [
    { label: 'Tuition Fee',              v: tuitionPaid   },
    { label: 'Transport Fee',            v: transportPaid },
    { label: 'Admission Fee',            v: admissionPaid },
    { label: 'Annual / Development Fee', v: annualPaid    },
    { label: 'ID Card Fee',              v: idCardPaid    },
    { label: 'Board / Exam Fee',         v: examPaid      },
    { label: 'Other Charges',            v: otherPaid     },
  ].filter(h => h.v > 0);

  const td = (content, style = '') =>
    `<td style="border:1px solid #ccc;padding:8px ${style ? ';' + style : ''}">${content}</td>`;

  const feeRows = feeHeads.map((h, i) =>
    `<tr>
      ${td(i + 1, 'text-align:center')}
      ${td(h.label)}
      ${td(fmtR(h.v), 'text-align:right')}
    </tr>`
  ).join('');

  const boldRow = (label, value, bg = '#f0f0f0', color = '#000') =>
    `<tr style="font-weight:bold;background:${bg};color:${color}">
      <td colspan="2" style="border:1px solid #ccc;padding:8px">${label}</td>
      <td style="border:1px solid #ccc;padding:8px;text-align:right">${value}</td>
    </tr>`;

  const summaryRows = [
    totalFeeDue > 0 ? boldRow('Total Fee Amount', fmtR(totalFeeDue)) : '',
    concession  > 0 ? boldRow('Concession / Discount', '(' + fmtR(concession) + ')', '#f0f0f0', '#2563eb') : '',
    totalFeeDue > 0 ? boldRow('Net Payable', fmtR(netPayable)) : '',
    boldRow('\u2705 Amount Paid',    fmtR(paidAmt),  '#f0fff4', '#16a34a'),
    boldRow('\ud83d\udd34 Remaining Due', fmtR(remaining), '#fff1f1', '#dc2626'),
  ].join('');

  const monthsCovered = data.months_covered || data.month_paid || 'Fee Payment';
  const logoUrl = window.location.origin + '/logo.png';
  const bldgUrl = window.location.origin + '/building.jpeg';

  // NOTE: script tag is built by concatenation to avoid JSX parser issues
  const scriptOpen  = '<' + 'script' + '>';
  const scriptClose = '<' + '/' + 'script' + '>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Fee Receipt - ${data.receipt_no || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; color: #000; background: #fff; }
    .wrap { max-width: 800px; margin: 20px auto; border: 2px solid #1a1a2e; border-radius: 6px; padding: 30px; }
    .header { display: flex; align-items: flex-start; gap: 14px; border-bottom: 3px double #1a1a2e; padding-bottom: 16px; margin-bottom: 18px; }
    .logo { width: 80px; height: 80px; object-fit: contain; flex-shrink: 0; }
    .school-info { flex: 1; text-align: center; }
    .school-name { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
    .school-sub { font-size: 12px; color: #333; margin-bottom: 2px; }
    .building { width: 110px; height: 80px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
    .banner { text-align: center; background: #1a1a2e; color: #fff; font-size: 15px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; padding: 7px; margin-bottom: 18px; border-radius: 3px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ddd; padding: 10px 14px; border-radius: 4px; background: #fafafa; }
    .info-row { display: flex; gap: 6px; margin-bottom: 4px; }
    .info-label { font-weight: bold; min-width: 115px; color: #444; white-space: nowrap; }
    .months-box { font-size: 13px; margin-bottom: 16px; padding: 6px 14px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5ff; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { background: #1a1a2e; color: #fff; padding: 9px 12px; text-align: left; }
    th.right { text-align: right; }
    td { border: 1px solid #ccc; padding: 8px 12px; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; font-size: 12px; color: #555; }
    .sig-line { width: 180px; border-top: 1px solid #000; margin-bottom: 6px; }
    .sig-name { font-weight: bold; font-size: 13px; color: #000; }
    @media print {
      @page { margin: 8mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'">
    <div class="school-info">
      <div class="school-name">New Sainik Public School</div>
      <div class="school-sub">Siyarpakha, Gudha Kalan, Naraini, Banda, U.P. &ndash; 210129</div>
      <div class="school-sub">&#128222; 7887299111, 9198343345 &nbsp;|&nbsp; inquiry@newsainikpublicschool.in</div>
      <div class="school-sub">Affiliation: EJ-6/18-19 &nbsp;|&nbsp; UDISE: 09400405918 &nbsp;|&nbsp; Acad. Year: 2026-2027</div>
    </div>
    <img src="${bldgUrl}" class="building" alt="Building" onerror="this.style.display='none'">
  </div>

  <div class="banner">Fee Receipt &ndash; Student Copy</div>

  <div class="info-grid">
    <div>
      <div class="info-row"><span class="info-label">Receipt No:</span><strong>${data.receipt_no || '&mdash;'}</strong></div>
      <div class="info-row"><span class="info-label">Date &amp; Time:</span><span>${fmtDate(data.created_at)}</span></div>
      <div class="info-row"><span class="info-label">Payment Mode:</span><span>${data.payment_mode || 'Cash'}</span></div>
      <div class="info-row"><span class="info-label">Handled By:</span><span>${data.collected_by || 'Admin'}</span></div>
    </div>
    <div>
      <div class="info-row"><span class="info-label">Student Name:</span><strong style="text-transform:uppercase">${data.student_name || '&mdash;'}</strong></div>
      <div class="info-row"><span class="info-label">Admission No:</span><span>${data.student_id || '&mdash;'}</span></div>
      <div class="info-row"><span class="info-label">Class:</span><strong>${data.class_name || '&mdash;'}</strong></div>
      <div class="info-row"><span class="info-label">Father's Name:</span><span style="text-transform:uppercase">${data.father_name || '&mdash;'}</span></div>
    </div>
  </div>

  <div class="months-box"><strong>Fee for:</strong> ${monthsCovered}</div>

  <table>
    <thead>
      <tr>
        <th style="width:50px">Sr.</th>
        <th>Description</th>
        <th class="right" style="width:180px">Amount (&#8377;)</th>
      </tr>
    </thead>
    <tbody>
      ${feeRows || '<tr><td colspan="3" style="text-align:center;color:#666;font-style:italic">Fee payment recorded</td></tr>'}
      ${summaryRows}
    </tbody>
  </table>

  <div class="footer">
    <div style="font-style:italic">&#9888; Computer-generated receipt. No signature required.</div>
    <div style="text-align:center">
      <div class="sig-line"></div>
      <div class="sig-name">Authorized Signatory</div>
      <div style="font-size:11px;color:#666">New Sainik Public School</div>
    </div>
  </div>
</div>
${scriptOpen}
  window.onload = function() {
    window.focus();
    window.print();
    setTimeout(function() { window.close(); }, 2000);
  };
${scriptClose}
</body>
</html>`;

  const pw = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
  if (!pw) {
    alert('Popup blocked! Please allow popups for this site in your browser settings, then try again.');
    return;
  }
  pw.document.open();
  pw.document.write(html);
  pw.document.close();
}
