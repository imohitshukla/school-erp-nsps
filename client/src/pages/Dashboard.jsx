import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserCheck, Shield, Users as UsersIcon, Settings, Download, Upload, Menu,
  CheckCircle, AlertTriangle, XCircle, X, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

/* ─── Beautiful Import Result Modal ─────────────────────────────────────── */
const ImportModal = ({ result, onClose }) => {
  if (!result) return null;

  const isSuccess = result.type === 'success';
  const isError = result.type === 'error';
  const isWarning = result.type === 'warning';

  const config = {
    success: {
      icon: <CheckCircle size={48} className="text-emerald-500" />,
      bg: 'from-emerald-50 to-white',
      border: 'border-emerald-200',
      titleColor: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
      title: 'Import Successful!',
    },
    warning: {
      icon: <AlertTriangle size={48} className="text-amber-500" />,
      bg: 'from-amber-50 to-white',
      border: 'border-amber-200',
      titleColor: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
      title: 'Import Done with Warnings',
    },
    error: {
      icon: <XCircle size={48} className="text-rose-500" />,
      bg: 'from-rose-50 to-white',
      border: 'border-rose-200',
      titleColor: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-700',
      title: 'Import Failed',
    },
  };

  const c = config[result.type] || config.success;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}>
      <div className={`relative bg-gradient-to-b ${c.bg} rounded-2xl shadow-2xl border ${c.border} w-full max-w-md overflow-hidden`}
        style={{ animation: 'modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        
        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors text-gray-500">
          <X size={18} />
        </button>

        {/* Icon + Title */}
        <div className="flex flex-col items-center pt-8 pb-4 px-8 text-center">
          <div className="mb-4" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }}>
            {c.icon}
          </div>
          <h3 className={`text-xl font-bold ${c.titleColor}`}>{c.title}</h3>
        </div>

        {/* Stats */}
        {result.count !== undefined && (
          <div className="flex justify-center px-8 pb-4">
            <div className={`${c.badge} rounded-full px-5 py-1.5 text-sm font-semibold`}>
              {result.count} records processed
            </div>
          </div>
        )}

        {/* Main message */}
        <div className="px-8 pb-4">
          <p className="text-gray-700 text-sm text-center leading-relaxed">{result.message}</p>
        </div>

        {/* Warnings */}
        {result.warnings?.length > 0 && (
          <div className="mx-6 mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={13} /> {result.warnings.length} Warning{result.warnings.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {result.warnings.map((w, i) => (
                <div key={i} className="text-xs text-amber-800 bg-white rounded-lg px-2.5 py-1.5 border border-amber-100 font-mono">
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {result.errors?.length > 0 && (
          <div className="mx-6 mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3">
            <p className="text-xs font-bold text-rose-700 mb-2 flex items-center gap-1.5">
              <XCircle size={13} /> {result.errors.length} Error{result.errors.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-rose-800 bg-white rounded-lg px-2.5 py-1.5 border border-rose-100 font-mono">
                  {e}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 px-6 pb-6 pt-2">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Close
          </button>
          {result.type !== 'error' && (
            <button onClick={onClose}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1">
              Done <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

/* ─── Student List Modal ─────────────────────────────────────────────────── */
const StudentListModal = ({ title, genderFilter, hasTransport, academicYear, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = `/api/students?academic_year=${academicYear}`;
    if (genderFilter) url += `&gender=${encodeURIComponent(genderFilter)}`;
    if (hasTransport) url += `&hasTransport=true`;
    api.get(url)
      .then(r => setStudents(r.data || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [academicYear, genderFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden" style={{ animation: 'modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{students.length} students found</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-48 text-gray-500 gap-2">
               <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="flex justify-center items-center h-48 text-gray-500">No students found.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 sticky top-0 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-semibold">Adm No</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Class</th>
                  <th className="px-6 py-3 font-semibold">Gender</th>
                  <th className="px-6 py-3 font-semibold text-right">Transport Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.adm_no} className="hover:bg-indigo-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-gray-500 text-xs">{s.adm_no}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-6 py-3 text-indigo-600 font-medium">{s.class_name}</td>
                    <td className="px-6 py-3 text-gray-600">{s.gender || '-'}</td>
                    <td className="px-6 py-3 text-gray-600 font-medium text-right text-teal-600">{parseFloat(s.transport_fee || 0) > 0 ? `₹${s.transport_fee}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Dashboard Component ────────────────────────────────────────────────── */
const Dashboard = () => {
  const { selectedAcademicYear } = useAppContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalActive: 0,
    totalOld: 0,
    totalMale: 0,
    totalFemale: 0,
    classStats: []
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feeUploading, setFeeUploading] = useState(false);
  const fileInputRef = useRef(null);
  const feeFileInputRef = useRef(null);

  // Modal states
  const [importModal, setImportModal] = useState(null);
  const [listModal, setListModal] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await api.get(`/api/students/stats?academicYear=${selectedAcademicYear}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedAcademicYear]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('academicYear', selectedAcademicYear);

    setUploading(true);
    try {
      const response = await api.postForm('/api/students/import', formData);
      const warnings = response.errors?.slice(0, 10) || [];
      setImportModal({
        type: warnings.length > 0 ? 'warning' : 'success',
        title: 'Student Import Done!',
        message: `Successfully added/updated ${response.insertedCount} students.`,
        count: response.insertedCount,
        warnings,
      });
      fetchStats();
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      setImportModal({ type: 'error', message: msg });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFeeFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('academicYear', selectedAcademicYear);

    setFeeUploading(true);
    try {
      const response = await api.postForm('/api/fees/import', formData);
      const warnings = response.errors?.slice(0, 10) || [];
      setImportModal({
        type: warnings.length > 0 ? 'warning' : 'success',
        title: 'Fee Import Done!',
        message: `Successfully updated ${response.insertedCount} fee records.`,
        count: response.insertedCount,
        warnings,
      });
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      setImportModal({ type: 'error', message: msg });
    } finally {
      setFeeUploading(false);
      if (feeFileInputRef.current) feeFileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Beautiful Import Result Modal */}
      <ImportModal result={importModal} onClose={() => setImportModal(null)} />

      {/* Student List Modal */}
      {listModal && (
        <StudentListModal
          title={listModal.title}
          genderFilter={listModal.genderFilter}
          hasTransport={listModal.hasTransport}
          academicYear={selectedAcademicYear}
          onClose={() => setListModal(null)}
        />
      )}

      {/* Top Menu / Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4">
        <div className="flex items-center space-x-2 text-indigo-600 mb-4 md:mb-0">
          <Menu size={20} />
          <h1 className="text-lg font-medium">Display in list</h1>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-700">
          <button className="flex items-center space-x-1 hover:text-indigo-600"><UserCheck size={16} /><span>Add</span></button>
          <button className="flex items-center space-x-1 hover:text-indigo-600"><Settings size={16} /><span>Administration</span></button>
          
          {/* Import Buttons */}
          <div className="flex gap-2 border-l border-gray-300 pl-4 ml-2">
            <div className="relative">
              <input 
                type="file" 
                accept=".csv,.xlsx,.xls"
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || feeUploading}
                className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm"
              >
                <Upload size={16} />
                <span>{uploading ? 'Importing...' : '1. Import Students'}</span>
              </button>
            </div>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".csv,.xlsx,.xls"
                className="hidden" 
                ref={feeFileInputRef}
                onChange={handleFeeFileUpload}
              />
              <button 
                onClick={() => feeFileInputRef.current?.click()}
                disabled={uploading || feeUploading}
                className="flex items-center space-x-1 bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors shadow-sm"
              >
                <Upload size={16} />
                <span>{feeUploading ? 'Importing...' : '2. Import Fees'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Active Students" value={stats.totalActive} icon={<UserCheck className="text-green-500" size={32} />} borderColor="border-green-400" titleColor="text-blue-600" onClick={() => setListModal({ title: 'All Active Students', genderFilter: '' })} />
        <KpiCard title="Old Students" value={stats.totalOld} icon={<div className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded transform -rotate-12">OLD</div>} borderColor="border-yellow-400" titleColor="text-blue-600" />
        <KpiCard title="Male Student" value={stats.totalMale} icon={<UserCheck className="text-blue-500" size={32} />} borderColor="border-blue-400" titleColor="text-blue-600" onClick={() => setListModal({ title: 'Male Students', genderFilter: 'Male' })} />
        <KpiCard title="Boarding" value={stats.totalBoarding || 0} icon={<Shield className="text-gray-800" size={32} />} borderColor="border-gray-300" titleColor="text-blue-600" />
        
        <KpiCard title="InActive Students" value={stats.totalInactive || 0} icon={<UserCheck className="text-red-500" size={32} />} borderColor="border-red-400" titleColor="text-blue-600" />
        <KpiCard title="New Students" value={stats.totalNew || stats.totalActive} icon={<div className="bg-cyan-400 text-white text-xs font-bold px-2 py-1 rounded transform -rotate-12">NEW</div>} borderColor="border-cyan-400" titleColor="text-blue-600" />
        <KpiCard title="Female Student" value={stats.totalFemale} icon={<UserCheck className="text-pink-500" size={32} />} borderColor="border-pink-400" titleColor="text-blue-600" onClick={() => setListModal({ title: 'Female Students', genderFilter: 'Female' })} />
        <KpiCard title="Transport" value={stats.totalTransport || 0} icon={<Shield className="text-blue-500" size={32} />} borderColor="border-blue-400" titleColor="text-blue-600" onClick={() => setListModal({ title: 'Transport Students', hasTransport: true })} />
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-gray-200 shadow-sm rounded p-4 mb-6">
        <h2 className="text-blue-500 font-bold mb-6 text-sm">Class-wise Students</h2>
        <div className="h-80 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-gray-500">Loading chart data...</div>
          ) : stats.classStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.classStats} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="class_name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} label={{ value: 'Students', angle: -90, position: 'insideLeft', fill: '#6b7280' }} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="count" fill="#f87171" radius={[2, 2, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">No student data available. Import students to see chart.</div>
          )}
        </div>
        <div className="text-center text-xs text-gray-500 mt-2 font-medium">Class</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 shadow-sm rounded p-4">
          <h2 className="text-blue-500 font-bold text-sm">School growth analytics - Student wise</h2>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded p-4">
          <h2 className="text-blue-500 font-bold text-sm">Religion-wise Students</h2>
        </div>
      </div>

    </div>
  );
};

const KpiCard = ({ title, value, icon, borderColor, titleColor, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white border-l-4 ${borderColor} border-y border-r border-gray-200 rounded p-4 shadow-sm flex justify-between items-center transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
  >
    <div>
      <div className={`${titleColor} text-xs font-bold mb-1`}>{title}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
    <div>{icon}</div>
  </div>
);

export default Dashboard;
