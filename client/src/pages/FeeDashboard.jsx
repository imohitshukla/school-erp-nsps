import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const FeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCollection: 0,
    monthCollection: 0,
    sessionCollection: 0,
    totalDiscount: 0,
    monthWiseData: [],
    last10DaysData: [],
    headWiseData: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/fees/dashboard-stats');
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching fee dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden p-4 bg-[#eef2f6] min-h-screen">
      
      {/* Sub-Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center text-blue-500 space-x-2 font-medium cursor-pointer hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          <span>Display in list</span>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0 text-sm text-gray-700 font-semibold">
          <Link to="/fees/payment" className="flex items-center space-x-1 hover:text-gray-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Take Fee</span>
          </Link>
          <Link to="/fees/daily-collection" className="flex items-center space-x-1 hover:text-gray-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>Reports</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Today collection" amount={`₹${stats.todayCollection.toLocaleString()}`} />
        <SummaryCard title="August collection" amount={`₹${stats.monthCollection.toLocaleString()}`} />
        <SummaryCard title="2026-2027 collection" amount={`₹${stats.sessionCollection.toLocaleString()}`} />
        <SummaryCard title="Total Discount" amount={`₹${stats.totalDiscount.toLocaleString()}`} />
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Month wise fees collection */}
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm">
          <h2 className="text-sm font-semibold text-blue-500 mb-4">
            Month wise fees collection
          </h2>
          <div className="h-72">
            {loading ? (
               <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthWiseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={true} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(value) => `${value/1000}K`} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="amount" fill="#008000" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">Month</div>
        </div>

        {/* Last 10 days Fees collection */}
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm">
          <h2 className="text-sm font-semibold text-blue-500 mb-4">
            Last 10 days Fees collection
          </h2>
          <div className="h-72">
            {loading ? (
               <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last10DaysData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={true} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(value) => `${value/1000}K`} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="amount" fill="#757575" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">Date</div>
        </div>
      </div>

      {/* Today head wise collection */}
      <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm w-full lg:w-1/2">
        <h2 className="text-sm font-semibold text-blue-500 mb-4">
          Today head wise collection
        </h2>
        <div className="h-56">
          {loading ? (
             <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.headWiseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis axisLine={true} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(value) => `${value/1000}K`} />
              <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="amount" fill="#467c9b" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};

const SummaryCard = ({ title, amount }) => (
  <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-semibold text-blue-500 mb-1">{title}</p>
      <h3 className="text-xl font-normal text-gray-800">{amount}</h3>
    </div>
    <div className="text-blue-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8"></circle>
        <path d="M12 8v4l3 3"></path>
        <path d="M8 8h.01"></path>
        <circle cx="16" cy="16" r="5" fill="#eef2f6" stroke="#3b82f6" />
        <path d="M14.5 16h3M16 14.5v3" stroke="#3b82f6" />
      </svg>
    </div>
  </div>
);

export default FeeDashboard;
