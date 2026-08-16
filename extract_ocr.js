const fs = require('fs');
const path = '/Users/mohitshukla/.gemini/antigravity-ide/brain/55f7640d-c95a-42f0-a383-70254e39ce76/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');
for (const line of lines) {
    if (!line) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.content && obj.content.includes('==Start of PDF==')) {
            fs.writeFileSync('/Users/mohitshukla/school managment software/ocr.txt', obj.content);
            console.log('Extracted OCR text!');
            break;
        }
    } catch(e) {}
}
