import pdfplumber
import pandas as pd
import json

pdf_path = "/Users/mohitshukla/Downloads/fee , 1 april to 15 aug .pdf"

print(f"Opening {pdf_path}...")
all_data = []
header = None

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        table = page.extract_table()
        if table:
            # The first page might have a title row and headers
            # subsequent pages might just have data or repeat headers
            if i == 0:
                header = [str(x).replace('\n', '') for x in table[0]]
                all_data.extend(table[1:])
            else:
                # If subsequent page starts with same header, skip it
                if str(table[0][0]).replace('\n', '') == header[0]:
                    all_data.extend(table[1:])
                else:
                    all_data.extend(table)

# Clean newlines from the data cells
clean_data = []
for row in all_data:
    clean_row = [str(cell).replace('\n', ' ').strip() if cell else '' for cell in row]
    clean_data.append(clean_row)

df = pd.DataFrame(clean_data, columns=header)
output_path = "/Users/mohitshukla/school managment software/clean_fee_report.csv"
df.to_csv(output_path, index=False)
print(f"Successfully converted PDF to CSV! Saved at: {output_path}")
print(f"Total rows extracted: {len(df)}")
