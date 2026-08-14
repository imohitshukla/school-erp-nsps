import React, { useState, useEffect } from 'react';
import { IndianRupee, Search, User, CheckCircle, AlertCircle, Calendar, Receipt } from 'lucide-react';
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
  const [monthlyDues, setMonthlyDues] = useState([]);

  // Selected months for payment
  const [selectedMonths, setSelectedMonths] = useState([]);

  // Form State for payment
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Compute totals from selected months
  const selectedDues = monthlyDues.filter(m => selectedMonths.includes(m.month_name));
  const totalTuition = selectedDues.reduce((sum, m) => sum + (parseFloat(m.tuition_due || 0) - parseFloat(m.tuition_paid || 0)), 0);
  const totalTransport = selectedDues.reduce((sum, m) => sum + (parseFloat(m.transport_due || 0) - parseFloat(m.transport_paid || 0)), 0);
  const totalOther = selectedDues.reduce((sum, m) => sum + (parseFloat(m.other_due || 0) - parseFloat(m.other_paid || 0)), 0);
  const totalConcession = selectedDues.reduce((sum, m) => sum + parseFloat(m.concession || 0), 0);
  const totalPayable = totalTuition + totalTransport + totalOther - totalConcession;

  // Annual summary
  const annualDue = monthlyDues.reduce((sum, m) => sum + parseFloat(m.tuition_due || 0) + parseFloat(m.transport_due || 0) + parseFloat(m.other_due || 0) - parseFloat(m.concession || 0), 0);
  const annualPaid = monthlyDues.reduce((sum, m) => sum + parseFloat(m.tuition_paid || 0) + parseFloat(m.transport_paid || 0) + parseFloat(m.other_paid || 0), 0);
  const annualBalance = annualDue - annualPaid;

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

  const loadStudent = (studentData) => {
    setActiveStudent(studentData);
    setMonthlyDues(studentData.monthly_dues || []);
    setSelectedMonths([]);
    setSuccess('');
    setError('');
  };

  const fetchStudentByAdmNo = async (e) => {
    e.preventDefault();
    if (!admNo.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.get(`/api/students/adm/${admNo.trim()}?academicYear=${selectedAcademicYear}`);
      loadStudent(response.data);
      setSelectedClass(response.data.class_name);
      setSelectedStudentId(response.data.adm_no);
      fetchStudentsByClass(response.data.class_name);
    } catch (err) {
      setError('Student not found with this Admission Number.');
      setActiveStudent(null);
      setMonthlyDues([]);
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

  const handleStudentSelect = async (e) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    
    if (sId) {
      setLoading(true);
      try {
        const response = await api.get(`/api/students/adm/${sId}?academicYear=${selectedAcademicYear}`);
        loadStudent(response.data);
        setAdmNo(sId);
      } catch (err) {
        setError('Failed to load student details');
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStudent(null);
      setMonthlyDues([]);
    }
  };

  const toggleMonth = (monthName) => {
    const due = monthlyDues.find(m => m.month_name === monthName);
    if (!due || due.status === 'PAID') return; // Can't select already paid months
    setSelectedMonths(prev => 
      prev.includes(monthName) 
        ? prev.filter(m => m !== monthName)
        : [...prev, monthName]
    );
  };

  const selectAllUnpaid = () => {
    const unpaid = monthlyDues.filter(m => m.status !== 'PAID').map(m => m.month_name);
    setSelectedMonths(unpaid);
  };

  const handleTakeFee = async (e) => {
    e.preventDefault();
    if (!activeStudent) {
      setError('Please select a student first.');
      return;
    }
    if (selectedMonths.length === 0) {
      setError('Please select at least one month to collect fee for.');
      return;
    }
    if (totalPayable <= 0) {
      setError('No due amount for selected months.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/fees/collect', {
        student_id: activeStudent.adm_no,
        amount: totalPayable,
        tuition_amount: totalTuition,
        transport_amount: totalTransport,
        months: selectedMonths,
        payment_mode: paymentMode,
        notes: paymentNote,
        receipt_no: receiptNo,
      });

      setSuccess(`✅ Fee collected! Receipt: ${response.data.receipt_no} | Months: ${selectedMonths.join(', ')} | Amount: ₹${totalPayable.toLocaleString()}`);
      
      // Refresh student data
      const refreshed = await api.get(`/api/students/adm/${activeStudent.adm_no}?academicYear=${selectedAcademicYear}`);
      loadStudent(refreshed.data);
      
      setPaymentNote('');
      setReceiptNo('');
      
    } catch (err) {
      setError(err.message || 'Failed to collect fee.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedMonths([]);
    setPaymentNote('');
    setReceiptNo('');
    setPaymentMode('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setSuccess('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">✅ PAID</span>;
      case 'PARTIAL':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold">⚠️ PARTIAL</span>;
      default:
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">🔴 UNPAID</span>;
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden p-2">
      <div className="flex items-center space-x-2 mb-6">
        <IndianRupee size={24} className="text-indigo-800" />
        <h1 className="text-xl font-bold text-gray-800">Fee Payment</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Search Section */}
        <div className="lg:w-1/3 space-y-4">
          <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-lg">
            <div className="flex justify-between items-center mb-4 border-b pb-2 border-orange-200">
              <h2 className="text-lg font-semibold text-orange-400 flex items-center space-x-1">
                <Search size={18} />
                <span>Find Student</span>
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <form onSubmit={fetchStudentByAdmNo}>
                <input 
                  type="text" 
                  placeholder="Enter Admission No. & press Enter" 
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={admNo}
                  onChange={(e) => setAdmNo(e.target.value)}
                />
              </form>
              
              <select 
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              
              <select 
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Annual Summary Card */}
          {activeStudent && monthlyDues.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
                <h3 className="text-white font-semibold text-sm">Annual Summary</h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Fee</span>
                  <span className="font-bold">₹{annualDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Total Paid</span>
                  <span className="font-bold">₹{annualPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className={`font-bold ${annualBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>Balance Due</span>
                  <span className={`font-bold text-lg ${annualBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{annualBalance.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${annualPaid >= annualDue ? 'bg-green-500' : 'bg-indigo-500'}`}
                      style={{ width: `${annualDue > 0 ? Math.min((annualPaid / annualDue) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    {annualDue > 0 ? Math.round((annualPaid / annualDue) * 100) : 0}% collected
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Month-wise Fee Table */}
        <div className="lg:w-2/3 bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Calendar size={18} />
              Month-wise Fee Structure
            </h2>
            {monthlyDues.length > 0 && (
              <button
                onClick={selectAllUnpaid}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Select All Unpaid
              </button>
            )}
          </div>

          {activeStudent ? (
            <div>
              <div className="p-3 bg-blue-50 text-blue-800 text-sm border-b border-blue-100 flex items-center space-x-2 font-medium">
                <User size={16} />
                <span>{activeStudent.name} (Adm: {activeStudent.adm_no} | Class: {activeStudent.class_name})</span>
              </div>

              {monthlyDues.length > 0 ? (
                <>
                  {/* Month-wise Table */}
                  <div className="overflow-x-auto text-[13px]">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="py-2 px-3 text-center w-10">☐</th>
                          <th className="py-2 px-3 text-left">Month</th>
                          <th className="py-2 px-3 text-right">Tuition</th>
                          <th className="py-2 px-3 text-right">Transport</th>
                          <th className="py-2 px-3 text-right">Other</th>
                          <th className="py-2 px-3 text-right">Concession</th>
                          <th className="py-2 px-3 text-right">Total Due</th>
                          <th className="py-2 px-3 text-right">Paid</th>
                          <th className="py-2 px-3 text-right">Balance</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyDues.map((m) => {
                          const monthTotal = parseFloat(m.tuition_due || 0) + parseFloat(m.transport_due || 0) + parseFloat(m.other_due || 0) - parseFloat(m.concession || 0);
                          const monthPaid = parseFloat(m.tuition_paid || 0) + parseFloat(m.transport_paid || 0) + parseFloat(m.other_paid || 0);
                          const monthBalance = monthTotal - monthPaid;
                          const isSelected = selectedMonths.includes(m.month_name);
                          const isPaid = m.status === 'PAID';

                          return (
                            <tr 
                              key={m.month_name} 
                              className={`border-b border-gray-100 transition-colors cursor-pointer ${
                                isPaid ? 'bg-green-50/50' : isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => toggleMonth(m.month_name)}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleMonth(m.month_name)}
                                  disabled={isPaid}
                                  className="form-checkbox text-indigo-600 rounded border-gray-300 disabled:opacity-30"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="py-2.5 px-3 font-medium text-gray-800">{m.month_name}</td>
                              <td className="py-2.5 px-3 text-right">₹{parseFloat(m.tuition_due || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right">₹{parseFloat(m.transport_due || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right">₹{parseFloat(m.other_due || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right text-orange-600">₹{parseFloat(m.concession || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right font-semibold">₹{monthTotal.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right text-green-600 font-semibold">₹{monthPaid.toLocaleString()}</td>
                              <td className={`py-2.5 px-3 text-right font-bold ${monthBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{monthBalance.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center">{getStatusBadge(m.status)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Selected Months Summary */}
                  {selectedMonths.length > 0 && (
                    <div className="bg-indigo-50 border-t-2 border-indigo-300 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Receipt size={16} className="text-indigo-700" />
                        <h3 className="font-bold text-indigo-800 text-sm">Payment Summary — {selectedMonths.length} month(s)</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        <div className="bg-white rounded-lg p-3 border border-indigo-200">
                          <p className="text-gray-500 text-xs">Tuition</p>
                          <p className="font-bold text-gray-800">₹{totalTuition.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-indigo-200">
                          <p className="text-gray-500 text-xs">Transport</p>
                          <p className="font-bold text-gray-800">₹{totalTransport.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-indigo-200">
                          <p className="text-gray-500 text-xs">Concession</p>
                          <p className="font-bold text-orange-600">-₹{totalConcession.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-600 rounded-lg p-3">
                          <p className="text-indigo-200 text-xs">Total Payable</p>
                          <p className="font-bold text-white text-lg">₹{totalPayable.toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-indigo-600 mb-3">
                        Months: {selectedMonths.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Payment Form */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}
                    {success && <div className="mb-4 text-green-600 bg-green-50 p-3 rounded-lg text-sm border border-green-200 flex items-center gap-2"><CheckCircle size={14}/>{success}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode *</label>
                        <select 
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        <label className="block text-xs font-bold text-gray-700 mb-1">Receipt No (optional)</label>
                        <input 
                          type="text" 
                          placeholder="Auto-generated if empty" 
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={receiptNo}
                          onChange={(e) => setReceiptNo(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Note (optional)</label>
                        <input 
                          type="text" 
                          placeholder="Payment note" 
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-3 md:mb-0">
                        {selectedMonths.length > 0 
                          ? <span className="font-bold text-indigo-700">Collecting ₹{totalPayable.toLocaleString()} for {selectedMonths.length} month(s)</span>
                          : <span className="text-gray-400">Select months above to collect fee</span>
                        }
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleTakeFee}
                          disabled={loading || selectedMonths.length === 0}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <IndianRupee size={14} />
                          {loading ? 'Processing...' : 'Collect Fee'}
                        </button>
                        <button 
                          onClick={handleReset}
                          className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-medium">No monthly dues configured for this student.</p>
                  <p className="text-xs text-gray-400 mt-1">Go to <strong>Fee Setup</strong> → create a class template → click <strong>Apply</strong></p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              <IndianRupee size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Search by Admission Number or select a student to view fee details and collect payments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeePayment;
