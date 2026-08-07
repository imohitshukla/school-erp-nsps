/**
 * Robust date parser for CSV imports.
 * Parses common date formats including DD/MM/YYYY, MM/DD/YYYY, and standard ISO formats.
 * 
 * @param {string} dateString - The raw string from the CSV
 * @returns {Date} A parsed Date object, or today's Date if unparseable
 */
const parseCSVDate = (dateString) => {
  if (!dateString) return new Date();

  const str = dateString.trim();

  // Handle DD/MM/YYYY or DD-MM-YYYY with optional hh:mm AM/PM
  const ddmmRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*(?:(\d{1,2}):(\d{1,2})\s*(AM|PM|am|pm)?)?(.*)$/;
  const match = str.match(ddmmRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(match[3], 10);
    
    let hour = 0;
    let minute = 0;
    
    if (match[4] && match[5]) {
      hour = parseInt(match[4], 10);
      minute = parseInt(match[5], 10);
      const ampm = match[6] ? match[6].toUpperCase() : '';
      
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
    }
    
    const parsedDate = new Date(year, month, day, hour, minute);
    
    // Check if the resulting date is valid and matches the input (to prevent rollover like Feb 30 -> Mar 2)
    if (!isNaN(parsedDate.getTime()) && parsedDate.getDate() === day && parsedDate.getMonth() === month) {
      return parsedDate;
    }
  }

  // Fallback to standard native JS parsing (handles YYYY-MM-DD, MM/DD/YYYY, etc.)
  const nativeParse = new Date(str);
  if (!isNaN(nativeParse.getTime())) {
    return nativeParse;
  }

  // Final fallback to current date if completely unparseable
  return new Date();
};

module.exports = { parseCSVDate };
