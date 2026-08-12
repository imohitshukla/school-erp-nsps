import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserCheck, Shield, Users as UsersIcon, Settings, Download, Upload, Menu 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const Dashboard = () => {
  const { selectedAcademicYear } = useAppContext();
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
      const errSummary = response.errors?.length > 0 ? `\n\nWarnings:\n${response.errors.slice(0, 3).join('\n')}` : '';
      alert(`✅ Student Import Done!\nAdded/Updated: ${response.insertedCount} students.${errSummary}`);
      fetchStats();
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      alert(`❌ Failed to import students.\n\n${msg}`);
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
      const errSummary = response.errors?.length > 0 ? `\n\nWarnings:\n${response.errors.slice(0, 3).join('\n')}` : '';
      alert(`✅ Fee Import Done!\nUpdated: ${response.insertedCount} records.${errSummary}`);
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      alert(`❌ Failed to import fees.\n\n${msg}`);
    } finally {
      setFeeUploading(false);
      if (feeFileInputRef.current) feeFileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      
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
        <KpiCard title="Active Students" value={stats.totalActive} icon={<UserCheck className="text-green-500" size={32} />} borderColor="border-green-400" titleColor="text-blue-600" />
        <KpiCard title="Old Students" value={stats.totalOld} icon={<div className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded transform -rotate-12">OLD</div>} borderColor="border-yellow-400" titleColor="text-blue-600" />
        <KpiCard title="Male Student" value={stats.totalMale} icon={<UserCheck className="text-blue-500" size={32} />} borderColor="border-blue-400" titleColor="text-blue-600" />
        <KpiCard title="Boarding" value="0" icon={<Shield className="text-gray-800" size={32} />} borderColor="border-gray-300" titleColor="text-blue-600" />
        
        <KpiCard title="InActive Students" value="0" icon={<UserCheck className="text-red-500" size={32} />} borderColor="border-red-400" titleColor="text-blue-600" />
        <KpiCard title="New Students" value={stats.totalActive} icon={<div className="bg-cyan-400 text-white text-xs font-bold px-2 py-1 rounded transform -rotate-12">NEW</div>} borderColor="border-cyan-400" titleColor="text-blue-600" />
        <KpiCard title="Female Student" value={stats.totalFemale} icon={<UserCheck className="text-pink-500" size={32} />} borderColor="border-pink-400" titleColor="text-blue-600" />
        <KpiCard title="Transport" value="0" icon={<Shield className="text-blue-500" size={32} />} borderColor="border-blue-400" titleColor="text-blue-600" />
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

const KpiCard = ({ title, value, icon, borderColor, titleColor }) => (
  <div className={`bg-white border-l-4 ${borderColor} border-y border-r border-gray-200 rounded p-4 shadow-sm flex justify-between items-center`}>
    <div>
      <div className={`${titleColor} text-xs font-bold mb-1`}>{title}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
    <div>{icon}</div>
  </div>
);

export default Dashboard;
