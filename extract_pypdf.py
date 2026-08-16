import PyPDF2
import csv
import re

pdf_path = "/Users/mohitshukla/Downloads/fee , 1 april to 15 aug .pdf"
csv_path = "/Users/mohitshukla/school managment software/clean_fee_report.csv"

# We need to extract:
# Admission Number, Total Payable, Concession, Amount Paid, Payment Mode, Payment Date, Receipt No
# From OCR text format, records usually look like:
# "1 461Ns DaySchola r Aradhya Singh UKG A Annual Chagre, Exam Fee, ID Card, Transport, Tuition Fee 3028 6 9000 0 9000 9000 0 Cash 01-04- 2026 09:16 AM Payment for April Fee to March Fee Pradeep Kumar Pathak"

print(f"Reading {pdf_path}...")

all_text = ""
try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            all_text += page.extract_text() + "\n"
except Exception as e:
    print(f"Error reading PDF: {e}")
    exit(1)

lines = all_text.split('\n')
lines_str = " ".join(lines)

records = []
current_record = {}

# Find all admission numbers
# Pattern: \s(\d{1,4}[a-zA-Z]{0,3})\s+DaySchola
# Wait, "461Ns" or "35"
# It's better to just extract based on the amounts block:
# (\d{4,5})\s+(?:\d+\s+)?(\d{2,5})\s+(\d+)\s+(\d{2,5})\s+(\d{2,5})\s+(\d+)\s+(Cash|Cheque|Online|Card)\s+(\d{2}-\d{2}-\s*\d{4})
# Wait, in the OCR text: "3028 6 9000 0 9000 9000 0 Cash 01-04- 2026"
# Receipt: 3028
# Roll: 6 (optional)
# TotAmount: 9000
# Discount: 0
# PayAmount: 9000
# TotalPaid: 9000
# TotDue: 0
# Mode: Cash
# Date: 01-04- 2026

pattern = re.compile(
    r'(?P<adm>\d{1,4}[a-zA-Z]{0,3})\s+DaySchola.*?'
    r'(?P<receipt>\d{4,5})\s+'
    r'(?:\d+\s+)?' # Optional Roll No
    r'(?P<tot>\d+)\s+'
    r'(?P<disc>\d+)\s+'
    r'(?P<pay>\d+)\s+'
    r'(?P<totpaid>\d+)\s+'
    r'(?P<due>\d+)\s+'
    r'(?P<mode>Cash|Cheque|Online|Card)\s+'
    r'(?P<date>\d{2}-\d{2}-\s*\d{4})',
    re.IGNORECASE | re.DOTALL
)

matches = pattern.finditer(lines_str)

for match in matches:
    date_clean = match.group('date').replace(' ', '').replace('\n', '')
    records.append({
        'Admission Number': match.group('adm'),
        'Total Payable': match.group('tot'),
        'Concession': match.group('disc'),
        'Amount Paid': match.group('pay'),
        'Payment Mode': match.group('mode'),
        'Payment Date': date_clean,
        'Receipt No': match.group('receipt')
    })

print(f"Extracted {len(records)} records using Regex 1")

# If regex 1 missed some due to spacing, let's try a simpler one:
if len(records) < 100:
    # Just find all lines with the amounts
    records = []
    # Let's just find Admission numbers
    adm_pattern = re.compile(r'\b(\d{1,4}[A-Za-z]{0,3})\s+DaySchola')
    amt_pattern = re.compile(r'(\d{4,5})\s+(?:\d+\s+)?(\d{2,6})\s+(\d+)\s+(\d{2,6})\s+(\d{2,6})\s+(\d+)\s+(Cash|Cheque|Online|Card)')
    date_pattern = re.compile(r'(\d{2}-\d{2}-\s*\d{4})')
    
    # We will slice the text into chunks for each student
    chunks = re.split(r'\b\d+\s+(?=\d{1,4}[A-Za-z]{0,3}\s+DaySchola)', lines_str)
    for chunk in chunks[1:]: # Skip the first chunk (header)
        adm_match = adm_pattern.search(chunk)
        amt_match = amt_pattern.search(chunk)
        date_match = date_pattern.search(chunk)
        
        if adm_match and amt_match and date_match:
            records.append({
                'Admission Number': adm_match.group(1),
                'Total Payable': amt_match.group(2),
                'Concession': amt_match.group(3),
                'Amount Paid': amt_match.group(4),
                'Payment Mode': amt_match.group(7),
                'Payment Date': date_match.group(1).replace(' ', '').replace('\n', ''),
                'Receipt No': amt_match.group(1)
            })
            
    print(f"Extracted {len(records)} records using Regex 2")

with open(csv_path, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'Admission Number', 'Total Payable', 'Concession', 
        'Amount Paid', 'Payment Mode', 'Payment Date', 'Receipt No'
    ])
    writer.writeheader()
    for r in records:
        writer.writerow(r)

print(f"CSV saved to {csv_path}")
