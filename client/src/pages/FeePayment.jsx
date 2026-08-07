import React, { useState, useEffect } from 'react';
import { IndianRupee, Search, User } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const FeePayment = () => {
  const { selectedAcademicYear } = useAppContext();
  const [admNo, setAdmNo] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [classList, setClassList] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]);
  
  // Student data to display
  const [activeStudent, setActiveStudent] = useState(null);

  // Form State for payment
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Editable fee structure fields
  const [grossPayable, setGrossPayable] = useState(0);
  const [editConcession, setEditConcession] = useState(0);
  const [pastPayments, setPastPayments] = useState(0);

  // When a student is selected, prefill from DB values
  useEffect(() => {
    if (activeStudent) {
      const tuition = parseFloat(activeStudent.payable_fee || 0);
      const transport = parseFloat(activeStudent.transport_fee || 0);
      setGrossPayable(tuition + transport);
      setEditConcession(parseFloat(activeStudent.concession || 0));
      setPastPayments(parseFloat(activeStudent.paid_past || 0));
    } else {
      setGrossPayable(0);
      setEditConcession(0);
      setPastPayments(0);
    }
  }, [activeStudent]);

  // Computed values from editable fields
  const netPayable = grossPayable - editConcession;
  const currentDue = netPayable - pastPayments;

  // Dynamic due based on typed paid amount
  const parsedPaidAmount = parseFloat(paidAmount) || 0;
  const remainingDue = currentDue - parsedPaidAmount;

  // helpers for number inputs
  const numInput = (val, setter) => (
    <input
      type="number"
      min="0"
      className="w-24 border border-blue-300 rounded px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
      value={val}
      onChange={e => setter(parseFloat(e.target.value) || 0)}
    />
  );


  // Fetch classes on mount
  useEffect(() => {
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

  const fetchStudentByAdmNo = async (e) => {
    e.preventDefault();
    if (!admNo.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.get(`/api/students/adm/${admNo.trim()}?academicYear=${selectedAcademicYear}`);
      setActiveStudent(response.data);
      // Also update the class dropdown and students list to match this student's class
      setSelectedClass(response.data.class_name);
      setSelectedStudentId(response.data.adm_no);
      fetchStudentsByClass(response.data.class_name);
    } catch (err) {
      setError('Student not found with this Admission Number.');
      setActiveStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async (className) => {
    if (!className) return;
    try {
      const response = await api.get(`/api/students/class/${encodeURIComponent(className)}`);
      setStudentsInClass(response.data || []);
    } catch (err) {
      console.error('Error fetching students for class:', err);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass(selectedClass);
    }
  }, [selectedClass]);

  const handleStudentSelect = (e) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    
    if (sId) {
      const student = studentsInClass.find(s => s.adm_no === sId);
      if (student) {
        setActiveStudent(student);
        setAdmNo(student.adm_no);
      }
    } else {
      setActiveStudent(null);
    }
  };

  const handleTakeFee = async (e) => {
    e.preventDefault();
    if (!activeStudent) {
      setError('Please select a student first.');
      return;
    }
    if (!paidAmount || parsedPaidAmount <= 0) {
      setError('Please enter a valid paid amount.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/fees/collect', {
        student_id: activeStudent.adm_no, // using adm_no as identifier for now
        amount: parsedPaidAmount,
        payment_mode: paymentMode,
        notes: paymentNote,
        receipt_no: receiptNo // optional custom receipt
      });

      setSuccess(`Fee collected successfully! Receipt No: ${response.data.receipt_no}`);
      
      // Reset form
      setPaidAmount('');
      setPaymentNote('');
      setReceiptNo('');
      
    } catch (err) {
      setError(err.message || 'Failed to collect fee.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPaidAmount('');
    setPaymentNote('');
    setReceiptNo('');
    setPaymentMode('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-full overflow-x-hidden p-2">
      <div className="flex items-center space-x-2 mb-6">
        <IndianRupee size={24} className="text-indigo-800" />
        <h1 className="text-xl font-bold text-gray-800">Fee Payment</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Search Section */}
        <div className="lg:w-1/3 bg-white p-4 border border-gray-200 shadow-sm rounded-md h-fit">
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-orange-200">
            <h2 className="text-lg font-semibold text-orange-400 flex items-center space-x-1">
              <IndianRupee size={18} />
              <span>Fee Payment</span>
            </h2>
            <button className="bg-indigo-600 text-white px-3 py-1 text-sm rounded flex items-center space-x-1 hover:bg-indigo-700">
              <Search size={14} />
              <span>Student</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <form onSubmit={fetchStudentByAdmNo}>
              <input 
                type="text" 
                placeholder="Adm No." 
                className="w-full border border-indigo-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={admNo}
                onChange={(e) => setAdmNo(e.target.value)}
              />
            </form>
            
            <select 
              className="w-full border border-indigo-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            
            <select 
              className="w-full border border-indigo-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={selectedStudentId}
              onChange={handleStudentSelect}
              disabled={!selectedClass}
            >
              <option value="">Select Student</option>
              {studentsInClass.map(s => (
                <option key={s.adm_no} value={s.adm_no}>{s.name} ({s.adm_no})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Fee Structure & Payment Form */}
        <div className="lg:w-2/3 bg-white border border-gray-200 shadow-sm rounded-md">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-800 text-lg">Fee Structure</h2>
            <a href="#" className="text-blue-600 text-sm font-medium hover:underline">Get Help</a>
          </div>

          {activeStudent ? (
            <div>
              <div className="p-3 bg-blue-50 text-blue-800 text-sm border-b border-blue-100 flex items-center space-x-2 font-medium">
                <User size={16} />
                <span>Selected Student: {activeStudent.name} (Adm: {activeStudent.adm_no} | Class: {activeStudent.class_name})</span>
              </div>
              
              <div className="overflow-x-auto text-[13px]">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="py-2 px-3 text-left w-1/4">Title</th>
                      <th className="py-2 px-3 text-left w-1/4">Payable</th>
                      <th className="py-2 px-3 text-left w-1/4">Paid</th>
                      <th className="py-2 px-3 text-left w-1/4">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 px-3 font-medium">Tuition Fee</td>
                      <td className="py-2 px-3">₹{tuitionFee}</td>
                      <td className="py-2 px-3 text-gray-400">-</td>
                      <td className="py-2 px-3 text-gray-400">-</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 px-3 font-medium">Transport Fee</td>
                      <td className="py-2 px-3">₹{transportFee}</td>
                      <td className="py-2 px-3 text-gray-400">-</td>
                      <td className="py-2 px-3 text-gray-400">-</td>
                    </tr>
                    
                    {/* Summary calculations - all editable */}
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="py-2 px-3 text-right font-bold text-gray-700">Gross Payable</td>
                      <td className="py-2 px-3 font-bold bg-gray-100">
                        {numInput(grossPayable, setGrossPayable)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan="3" className="py-2 px-3 text-right font-bold text-gray-700">Concession</td>
                      <td className="py-2 px-3 font-bold bg-gray-100">
                        {numInput(editConcession, setEditConcession)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan="3" className="py-2 px-3 text-right font-bold text-gray-700">Net Payable</td>
                      <td className="py-2 px-3 font-bold bg-blue-50 text-blue-700 text-right">
                        ₹{netPayable}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan="3" className="py-2 px-3 text-right font-bold text-gray-700 text-green-600">Past Payments</td>
                      <td className="py-2 px-3 font-bold bg-gray-100 text-green-600">
                        {numInput(pastPayments, setPastPayments)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan="3" className="py-2 px-3 text-right font-bold text-gray-700 text-red-600">Current Due</td>
                      <td className="py-2 px-3 font-bold bg-red-50 text-red-600 text-right">
                        ₹{currentDue}
                      </td>
                    </tr>
                    
                    {/* Payment Input Row */}
                    <tr className="border-t border-gray-200 bg-blue-50/30">
                      <td colSpan="3" className="py-2 px-3">
                        <div className="text-blue-700 font-medium text-right">
                          Hit "ENTER" or Equal(=) button after entering "Paid" amount / "भुगतान" राशि दर्ज करने के बाद एंटर या समान (=) बटन दबाएं
                        </div>
                      </td>
                      <td className="py-2 px-3 font-bold bg-gray-100 flex items-center space-x-2">
                        <span className="text-gray-700 mr-2">Paid</span>
                        <input 
                          type="number" 
                          className="w-24 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                        />
                        <button className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded font-bold hover:bg-green-600">=</button>
                      </td>
                    </tr>

                    {/* Final Due Row */}
                    <tr className="bg-gray-50 border-t border-gray-200 border-b border-gray-200">
                      <td colSpan="3" className="py-2 px-3 text-right font-bold text-gray-700">Due (Payable - Paid)</td>
                      <td className={`py-2 px-3 font-bold bg-gray-100 ${remainingDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {remainingDue}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Details Form */}
              <div className="p-4 bg-gray-50">
                
                {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded text-sm border border-red-200">{error}</div>}
                {success && <div className="mb-4 text-green-600 bg-green-50 p-2 rounded text-sm border border-green-200">{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1">Payment Mode<span className="text-red-500">*</span></label>
                    <select 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1">Payment Date<span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <input 
                      type="text" 
                      placeholder="School Receipt No" 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Payment Note" 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-3 border-t border-gray-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-gray-800 cursor-pointer mb-4 md:mb-0">
                    <input type="checkbox" className="form-checkbox text-indigo-600 rounded border-gray-300" />
                    <span>Keep same payment detail for the next fee payment</span>
                  </label>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleTakeFee}
                      disabled={loading}
                      className="bg-indigo-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                      {loading ? 'Processing...' : 'Take Fee'}
                    </button>
                    <button 
                      onClick={handleReset}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50"
                    >
                      Reset
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              <IndianRupee size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Please search by Admission Number or select a Student to view Fee Structure and process payment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeePayment;
