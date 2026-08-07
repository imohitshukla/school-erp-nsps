import React, { useState, useEffect } from 'react';
import { IndianRupee, Printer, FileText, FileSpreadsheet, Search, ChevronDown, CheckSquare, PrinterIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const DailyCollectionReport = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printReceipt, setPrintReceipt] = useState(null);
  
  // Filter States
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [classList, setClassList] = useState([]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (selectedClass && selectedClass !== 'All') queryParams.append('class', selectedClass);
      if (selectedMode && selectedMode !== 'All') queryParams.append('mode', selectedMode);

      const response = await api.get(`/api/fees/daily-collection?${queryParams.toString()}`);
      setCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch classes for the dropdown
    const fetchClasses = async () => {
      try {
        const response = await api.get('/api/students/classes');
        setClassList(response.data || []);
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [startDate, endDate, selectedClass, selectedMode]); // Auto-refresh when filters change

  useEffect(() => {
    const handleAfterPrint = () => setPrintReceipt(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrint = (receiptData) => {
    setPrintReceipt(receiptData);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const totalAmount = collections.reduce((sum, item) => sum + parseFloat(item.pay_amt || 0), 0);
  
  const modeTotals = collections.reduce((acc, item) => {
    const mode = item.mode || 'Unknown';
    acc[mode] = (acc[mode] || 0) + parseFloat(item.pay_amt || 0);
    return acc;
  }, {});

  const takenByTotals = collections.reduce((acc, item) => {
    const user = item.taken_by || 'Unknown';
    acc[user] = (acc[user] || 0) + parseFloat(item.pay_amt || 0);
    return acc;
  }, {});
  return (
    <div className="max-w-full overflow-x-hidden">
      <div className="print:hidden">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center space-x-2">
          <IndianRupee size={24} className="text-indigo-800" />
          <h1 className="text-xl font-bold text-gray-800">Fee Management</h1>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0 text-sm">
          <TopNavDropdown label="Fee Masters" />
          <TopNavDropdown label="Cheque" />
          <TopNavButton label="Fee Reports" />
          <Link to="/fees/payment">
            <TopNavButton label="Fee Payment" />
          </Link>
          <TopNavDropdown label="Concession" />
          <TopNavDropdown label="Refund" />
          <TopNavDropdown label="Voucher" />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🗄️</span>
          <h2 className="text-lg font-bold text-gray-800">Daily Collection Report</h2>
        </div>
        <div className="flex space-x-2">
          <button className="p-1 border border-green-300 text-green-600 rounded bg-green-50"><FileSpreadsheet size={18} /></button>
          <button className="p-1 border border-red-300 text-red-600 rounded bg-red-50"><FileText size={18} /></button>
          <button className="p-1 border border-green-300 text-green-600 rounded bg-green-50"><Printer size={18} /></button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 p-3 shadow-sm mb-6 rounded-md">
        
        {/* Top filter row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-3 border-b border-gray-100 pb-3">
          <button className="border border-indigo-600 text-indigo-700 px-4 py-1 rounded-full text-sm font-medium">
            3 Reports
          </button>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-700 font-medium">
            <Checkbox label="Concession" />
            <Checkbox label="Current Session" />
            <Checkbox label="Cancelled Fee" />
            <Checkbox label="Exclude Emp Ward" />
            <Checkbox label="Exclude Voucher Fee" />
          </div>
        </div>

        {/* Bottom filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[120px] bg-white text-gray-700 outline-none"
            value={selectedMode}
            onChange={e => setSelectedMode(e.target.value)}
          >
            <option value="All">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>

          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-700 outline-none" 
          />
          <span className="text-gray-500 text-sm">to</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-700 outline-none" 
          />
          
          <select 
            className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[150px] bg-white text-gray-700 outline-none"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="All">All Classes</option>
            {classList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center space-x-1 hover:bg-blue-600 transition-colors">
            <Search size={16} />
            <span>Section</span>
          </button>
          <select className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[150px] bg-white text-gray-700 outline-none">
            <option>All Sections</option>
          </select>
          <button 
            onClick={fetchCollections}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center space-x-1 hover:bg-indigo-700 transition-colors ml-auto"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-300 shadow-sm overflow-x-auto text-[13px] mb-8">
        <table className="w-full whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700">
              <th className="py-2 px-3 border-r border-gray-300 w-8"></th>
              <th className="py-2 px-3 border-r border-gray-300 text-blue-600 font-medium">Status</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Student Name</th>
              <th className="py-2 px-3 border-r border-gray-300 text-blue-600 font-medium text-left">Adm No.</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Class</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Rcpt No</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Tot.Amt</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Concession</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Pay Amt</th>
              <th className="py-2 px-3 border-r border-gray-300 text-green-600 font-medium text-left">Paid</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Due</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Mode</th>
              <th className="py-2 px-3 border-r border-gray-300 text-left">Note</th>
              <th className="py-2 px-3 border-r border-gray-300 text-blue-600 font-medium text-left">Date and Time</th>
              <th className="py-2 px-3 text-left">Taken By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="15" className="py-8 text-center text-gray-500">Loading data...</td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td colSpan="15" className="py-8 text-center text-gray-500">No collections found.</td>
              </tr>
            ) : (
              collections.map((c, idx) => (
                <TableRow 
                  key={c.receipt_no}
                  status="P" 
                  name={c.student_name} 
                  admNo={c.adm_no} 
                  classStr={c.class} 
                  rcpt={`F.No ${c.receipt_no}`}
                  tot={c.pay_amt} 
                  con="0" 
                  payAmt={c.pay_amt} 
                  paid={c.pay_amt} 
                  due="0" 
                  mode={c.mode} 
                  note={c.notes}
                  date={new Date(c.date_and_time).toLocaleString()} 
                  takenBy={c.taken_by} 
                  bg={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  onPrint={() => handlePrint(c)}
                />
              ))
            )}
            
            {/* Totals Row */}
            <tr className="bg-gray-500 text-white font-bold border-t border-gray-400">
              <td colSpan="6" className="py-2 px-3 border-r border-gray-400"></td>
              <td className="py-2 px-3 border-r border-gray-400 text-right">Total</td>
              <td className="py-2 px-3 border-r border-gray-400">{totalAmount.toFixed(2)}</td>
              <td className="py-2 px-3 border-r border-gray-400">0</td>
              <td colSpan="6" className="py-2 px-3"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Tables */}
      <div className="flex flex-col md:flex-row gap-8 justify-center text-sm pb-10">
        <div className="w-full max-w-sm">
          <table className="w-full border border-gray-300 bg-white">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-2 px-3 text-left font-bold w-2/3">Payment Mode</th>
                <th className="py-2 px-3 text-left font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(modeTotals).map(([mode, amount]) => (
                <tr key={mode} className="border-b border-gray-200">
                  <td className="py-2 px-3">{mode}</td>
                  <td className="py-2 px-3">{amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3">{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="w-full max-w-sm">
          <table className="w-full border border-gray-300 bg-white">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-2 px-3 text-left font-bold w-2/3">Taken By</th>
                <th className="py-2 px-3 text-left font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(takenByTotals).map(([user, amount]) => (
                <tr key={user} className="border-b border-gray-200">
                  <td className="py-2 px-3">{user}</td>
                  <td className="py-2 px-3">{amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3">{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 pt-8 pb-4 no-print">
        Copyright © Scientific Study | All rights reserved.
      </div>

      {/* Printable Receipt Container ends here */}
      </div> {/* End print:hidden */}

      {/* Printable Receipt Container */}
      {printReceipt && (
        <div className="hidden print:block fixed inset-0 bg-white z-50 p-8 text-black font-sans">
          <div className="border-2 border-gray-800 p-8 rounded-lg max-w-2xl mx-auto">
            <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
              <img src="/logo.jpg" alt="New Sainik Public School Logo" className="h-24 w-24 object-contain mx-auto mb-4" />
              <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">New Sainik Public School</h1>
              <p className="text-gray-600 font-medium">School Code: <span className="font-bold">nsps</span></p>
              <h2 className="text-xl font-bold mt-4 bg-gray-200 inline-block px-4 py-1 rounded">FEE RECEIPT</h2>
            </div>
            
            <div className="flex justify-between mb-8">
              <div>
                <p><span className="font-bold">Receipt No:</span> F.No {printReceipt.receipt_no}</p>
                <p><span className="font-bold">Date & Time:</span> {new Date(printReceipt.date_and_time).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold">Payment Mode:</span> {printReceipt.mode}</p>
                <p><span className="font-bold">Handled By:</span> {printReceipt.taken_by}</p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded mb-8">
              <p><span className="font-bold">Student Name:</span> <span className="uppercase">{printReceipt.student_name}</span></p>
              <p><span className="font-bold">Admission No:</span> {printReceipt.adm_no}</p>
              <p><span className="font-bold">Class & Section:</span> {printReceipt.class}</p>
            </div>

            <table className="w-full mb-12 border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 py-2 px-4 text-left">Description</th>
                  <th className="border border-gray-400 py-2 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 py-2 px-4">Total Fee Amount</td>
                  <td className="border border-gray-400 py-2 px-4 text-right">{printReceipt.pay_amt}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 py-2 px-4">Applied Concession</td>
                  <td className="border border-gray-400 py-2 px-4 text-right">0.00</td>
                </tr>
                <tr className="font-bold bg-gray-100">
                  <td className="border border-gray-400 py-2 px-4">Net Payable</td>
                  <td className="border border-gray-400 py-2 px-4 text-right">{printReceipt.pay_amt}</td>
                </tr>
                <tr className="font-bold">
                  <td className="border border-gray-400 py-2 px-4 text-green-700">Paid Amount</td>
                  <td className="border border-gray-400 py-2 px-4 text-right text-green-700">{printReceipt.pay_amt}</td>
                </tr>
                <tr className="font-bold">
                  <td className="border border-gray-400 py-2 px-4 text-red-700">Remaining Due</td>
                  <td className="border border-gray-400 py-2 px-4 text-right text-red-700">0.00</td>
                </tr>
              </tbody>
            </table>

            {printReceipt.notes && (
              <div className="mb-12">
                <p><span className="font-bold">Note/Remarks:</span> {printReceipt.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-end mt-16 pt-16">
              <div className="text-sm text-gray-500 italic">
                * This is a computer-generated receipt.
              </div>
              <div className="text-center border-t border-gray-800 pt-2 w-48 font-bold">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const TopNavDropdown = ({ label }) => (
  <button className="flex items-center space-x-1 border border-indigo-200 text-indigo-700 bg-white px-3 py-1 rounded text-sm hover:bg-indigo-50">
    <span>{label}</span>
    <ChevronDown size={14} />
  </button>
);

const TopNavButton = ({ label }) => (
  <button className="border border-indigo-200 text-indigo-700 bg-white px-3 py-1 rounded text-sm hover:bg-indigo-50">
    {label}
  </button>
);

const Checkbox = ({ label }) => (
  <label className="flex items-center space-x-2 cursor-pointer">
    <input type="checkbox" className="form-checkbox text-indigo-600 rounded border-gray-300" />
    <span>{label}</span>
  </label>
);

const TableRow = ({ status, name, admNo, classStr, rcpt, tot, con, payAmt, paid, due, mode, date, takenBy, note, bg, onPrint }) => (
  <tr className={`${bg} border-b border-gray-300 hover:bg-gray-100 transition-colors`}>
    <td className="py-2 px-3 border-r border-gray-300 text-center">
      <div onClick={onPrint} className="bg-orange-400 text-white p-1 rounded inline-block cursor-pointer"><PrinterIcon size={14} /></div>
    </td>
    <td className="py-2 px-3 border-r border-gray-300 text-center">
      <div className="border border-green-500 text-green-600 font-bold rounded w-6 h-6 flex items-center justify-center mx-auto text-xs">{status}</div>
    </td>
    <td className="py-2 px-3 border-r border-gray-300">{name}</td>
    <td className="py-2 px-3 border-r border-gray-300 text-blue-500 underline cursor-pointer">{admNo}</td>
    <td className="py-2 px-3 border-r border-gray-300">{classStr}</td>
    <td className="py-2 px-3 border-r border-gray-300">{rcpt}</td>
    <td className="py-2 px-3 border-r border-gray-300">{tot}</td>
    <td className="py-2 px-3 border-r border-gray-300">{con}</td>
    <td className="py-2 px-3 border-r border-gray-300">{payAmt}</td>
    <td className="py-2 px-3 border-r border-gray-300 text-green-600">{paid}</td>
    <td className="py-2 px-3 border-r border-gray-300">{due}</td>
    <td className="py-2 px-3 border-r border-gray-300">{mode}</td>
    <td className="py-2 px-3 border-r border-gray-300">{note}</td>
    <td className="py-2 px-3 border-r border-gray-300">{date}</td>
    <td className="py-2 px-3">{takenBy}</td>
  </tr>
);

export default DailyCollectionReport;
