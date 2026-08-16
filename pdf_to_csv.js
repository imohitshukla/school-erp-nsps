const fs = require('fs');
const pdf = require('pdf-parse');
const { createObjectCsvWriter } = require('csv-writer');

const pdfPath = '/Users/mohitshukla/Downloads/fee , 1 april to 15 aug .pdf';
const csvPath = '/Users/mohitshukla/school managment software/clean_fee_report.csv';

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    const text = data.text;
    const lines = text.split('\n');
    
    const parsedData = [];
    
    // We will extract data based on standard patterns matching the rows.
    // Looking at the OCR text, rows usually start with: number followed by Ns/letters and DayScholar...
    // Example: "1 461Ns DaySchola" or just a line with numbers.
    // A better approach is to match the Admission No, Tot. Amount, Discount, Pay Amount, Date, Receipt No.
    
    // Pattern for matching: 
    // Admission numbers like: 461Ns, 35, 611Ns, etc. usually after a serial number.
    // Date like: 01-04-2026 or 01-04- 2026
    
    // Since pure text from PDF can be jumbled, let's use regex to find all matches of the key fields in the whole text.
    // It's much easier to just capture blocks of text per student or use the table structure if possible.
    // Wait, pdf-parse just gives raw text.
    // But we know there are exactly 484 records.
    // We can extract all lines that look like:
    // "1 461Ns DaySchola" -> admission number is 461Ns
    
    // Actually, writing a perfect regex for a messy PDF text is hard. 
    // Let's try to extract blocks based on serial numbers.
    
    let currentRecord = {};
    let records = [];
    
    // Let's just do a basic match on the raw text for the data we need.
    // We need: Adm.No, Tot. Amount, Discount, Pay Amount, Date, Receipt No, PaymentMode
    // Wait! Since the backend import script parses columns by header, we can just output a CSV.
    // To properly parse the raw text:
    
    const linesStr = lines.join(' ');
    
    // Regex to find Receipt No and Amounts:
    // In the text: "3028 6 9000 0 9000 9000 0 Cash"
    // "Receipt No" "Roll" "Tot. Amount" "Discount" "Pay Amount" "TotalPaid" "Tot. Due" "PaymentMode"
    // Regex: (\d{4})\s+\d*\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(Cash|Cheque|Online)
    const amountRegex = /(\d{4,5})\s+(?:\d+\s+)?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(Cash|Cheque|Online|Card)/g;
    
    // Let's iterate through lines and try to piece records together
    let tempRecords = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Check for serial number + adm no
        // e.g. "1 461Ns DaySchola" or "2 35 DaySchola"
        const admMatch = line.match(/^(\d+)\s+([a-zA-Z0-9\/]+)\s+DaySchola/);
        if (admMatch) {
            tempRecords.push({
                srNo: admMatch[1],
                admNo: admMatch[2],
                lineIndex: i
            });
        }
    }
    
    // Now extract amounts which are on nearby lines
    for (let r of tempRecords) {
        let recordLines = lines.slice(r.lineIndex, r.lineIndex + 20).join(' '); // Look ahead 20 lines
        
        // Find amount block: "3028 6 9000 0 9000 9000 0 Cash"
        let amtMatch = recordLines.match(/(\d{4,5})\s+(?:\d+\s+)?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(Cash|Cheque|Online|Card)/i);
        
        // Find Date: "01-04- 2026" or "01-04-2026"
        let dateMatch = recordLines.match(/(\d{2}-\d{2}-\s*\d{4})/);
        
        if (amtMatch) {
            r.receiptNo = amtMatch[1];
            r.totAmount = amtMatch[2]; // Payable Fee
            r.discount = amtMatch[3]; // Concession
            r.payAmount = amtMatch[4]; // Paid Past
            r.paymentMode = amtMatch[7];
        } else {
            // Backup match if roll no is missing: "3030 7100 1000 6100 6100 0 Cash"
            let amtMatch2 = recordLines.match(/(\d{4,5})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(Cash|Cheque|Online|Card)/i);
            if (amtMatch2) {
                r.receiptNo = amtMatch2[1];
                r.totAmount = amtMatch2[2];
                r.discount = amtMatch2[3];
                r.payAmount = amtMatch2[4];
                r.paymentMode = amtMatch2[7];
            }
        }
        
        if (dateMatch) {
            r.date = dateMatch[1].replace(/\s+/g, '');
        }
        
        if (r.totAmount) {
            records.push(r);
        }
    }
    
    const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: [
            {id: 'admNo', title: 'Admission Number'},
            {id: 'totAmount', title: 'Total Payable'},
            {id: 'discount', title: 'Concession'},
            {id: 'payAmount', title: 'Amount Paid'},
            {id: 'paymentMode', title: 'Payment Mode'},
            {id: 'date', title: 'Payment Date'},
            {id: 'receiptNo', title: 'Receipt No'}
        ]
    });
    
    csvWriter.writeRecords(records)
        .then(() => {
            console.log('Done writing CSV. Extracted ' + records.length + ' records.');
        });
        
});
