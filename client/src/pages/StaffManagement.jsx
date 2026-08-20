import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, CheckCircle, IndianRupee, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StaffManagement = () => {
  const { auth } = useAppContext();
  const [activeTab, setActiveTab] = useState('directory'); // directory, attendance, payroll
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  // Directory Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', department: '', role: '', phone: '', email: '', joining_date: '', base_salary: ''
  });

  // Attendance
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({}); // { staff_id: status }

  // Payroll
  const [payrollMonth, setPayrollMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [salaries, setSalaries] = useState([]);
  const [deductions, setDeductions] = useState({}); // { staff_id: amount }

  useEffect(() => {
    if (auth?.token) {
      fetchStaff();
      if (activeTab === 'payroll') fetchSalaries();
    }
  }, [auth, activeTab, payrollMonth, payrollYear]);

  useEffect(() => {
    if (activeTab === 'attendance' && staff.length > 0) fetchAttendance();
  }, [activeTab, attDate, staff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/staff`, { headers: { Authorization: `Bearer ${auth.token}` } });
      setStaff(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/staff`, formData, { headers: { Authorization: `Bearer ${auth.token}` } });
      setShowForm(false);
      fetchStaff();
    } catch (err) { console.error(err); }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/attendance?date=${attDate}`, { headers: { Authorization: `Bearer ${auth.token}` } });
      const attMap = {};
      (res.data.data || []).forEach(record => {
        attMap[record.staff_id] = record.status;
      });
      setAttendance(attMap);
    } catch (err) { console.error(err); }
  };

  const saveAttendance = async () => {
    const records = Object.keys(attendance).map(staff_id => ({ staff_id, status: attendance[staff_id] }));
    try {
      await axios.post(`${BASE_URL}/api/staff/attendance`, { records, date: attDate }, { headers: { Authorization: `Bearer ${auth.token}` } });
      alert("Attendance saved!");
    } catch (err) { console.error(err); }
  };

  const fetchSalaries = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/salaries?month=${payrollMonth}&year=${payrollYear}`, { headers: { Authorization: `Bearer ${auth.token}` } });
      setSalaries(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const generateSalary = async (staff_id) => {
    try {
      await axios.post(`${BASE_URL}/api/staff/salaries`, {
        staff_id, month: payrollMonth, year: payrollYear, deductions: deductions[staff_id] || 0
      }, { headers: { Authorization: `Bearer ${auth.token}` } });
      fetchSalaries();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#374151' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>Staff & HR Management</h1>
      
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        {['directory', 'attendance', 'payroll'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
            color: activeTab === tab ? '#4f46e5' : '#6b7280', fontWeight: activeTab === tab ? 'bold' : 'normal',
            textTransform: 'capitalize'
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'directory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
            <button onClick={() => setShowForm(!showForm)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Add Staff
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleStaffSubmit} style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div><label style={lblStyle}>Name</label><input style={inpStyle} required onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
                <div><label style={lblStyle}>Role</label><input style={inpStyle} required onChange={e=>setFormData({...formData, role: e.target.value})} placeholder="Teacher, Admin, etc."/></div>
                <div><label style={lblStyle}>Department</label><input style={inpStyle} required onChange={e=>setFormData({...formData, department: e.target.value})} /></div>
                <div><label style={lblStyle}>Phone</label><input style={inpStyle} onChange={e=>setFormData({...formData, phone: e.target.value})} /></div>
                <div><label style={lblStyle}>Joining Date</label><input type="date" style={inpStyle} onChange={e=>setFormData({...formData, joining_date: e.target.value})} /></div>
                <div><label style={lblStyle}>Base Salary (₹)</label><input type="number" style={inpStyle} onChange={e=>setFormData({...formData, base_salary: e.target.value})} /></div>
              </div>
              <div style={{ marginTop: 15, textAlign: 'right' }}><button style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4 }}>Save Staff</button></div>
            </form>
          )}

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={thStyle}>Name</th><th style={thStyle}>Role</th><th style={thStyle}>Department</th><th style={thStyle}>Phone</th><th style={thStyle}>Base Salary</th>
              </tr></thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{s.name}</td>
                    <td style={tdStyle}>{s.role}</td><td style={tdStyle}>{s.department}</td>
                    <td style={tdStyle}>{s.phone}</td><td style={tdStyle}>₹{parseFloat(s.base_salary||0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
            <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ ...inpStyle, width: '200px' }} />
            <button onClick={saveAttendance} style={{ background: '#059669', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save Attendance</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={thStyle}>Staff Name</th><th style={thStyle}>Role</th><th style={thStyle}>Status</th>
              </tr></thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{s.name}</td><td style={tdStyle}>{s.role}</td>
                    <td style={tdStyle}>
                      <select style={inpStyle} value={attendance[s.id] || ''} onChange={e => setAttendance({...attendance, [s.id]: e.target.value})}>
                        <option value="">- Select -</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Leave">Leave</option>
                        <option value="Half-Day">Half-Day</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
            <select style={inpStyle} value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
            </select>
            <input type="number" style={inpStyle} value={payrollYear} onChange={e => setPayrollYear(e.target.value)} />
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={thStyle}>Staff Name</th><th style={thStyle}>Base Salary</th><th style={thStyle}>Deductions</th><th style={thStyle}>Net Salary</th><th style={thStyle}>Action</th>
              </tr></thead>
              <tbody>
                {staff.map(s => {
                  const paidRecord = salaries.find(sal => sal.staff_id === s.id);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{s.name}</td>
                      <td style={tdStyle}>₹{parseFloat(s.base_salary||0).toLocaleString()}</td>
                      {paidRecord ? (
                        <>
                          <td style={tdStyle}>₹{parseFloat(paidRecord.deductions).toLocaleString()}</td>
                          <td style={{ ...tdStyle, color: '#059669', fontWeight: 'bold' }}>₹{parseFloat(paidRecord.net_salary).toLocaleString()}</td>
                          <td style={tdStyle}><span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={16}/> Paid</span></td>
                        </>
                      ) : (
                        <>
                          <td style={tdStyle}>
                            <input type="number" placeholder="0" style={{ ...inpStyle, width: 100 }} value={deductions[s.id] || ''} onChange={e => setDeductions({...deductions, [s.id]: e.target.value})} />
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 'bold' }}>₹{(parseFloat(s.base_salary||0) - parseFloat(deductions[s.id]||0)).toLocaleString()}</td>
                          <td style={tdStyle}>
                            <button onClick={() => generateSalary(s.id)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Mark Paid</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const lblStyle = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' };
const inpStyle = { width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box' };
const thStyle = { padding: '12px 16px', color: '#6b7280', fontSize: 13, fontWeight: 500 };
const tdStyle = { padding: '12px 16px', fontSize: 14 };

export default StaffManagement;
