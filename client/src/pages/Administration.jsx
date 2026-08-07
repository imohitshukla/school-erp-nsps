import React from 'react';
import { Users, FileText, UserCheck, Briefcase, TrendingUp } from 'lucide-react';

const Administration = () => {
  const stats = [
    { name: 'Total Employees', value: '112', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { name: 'Present Today', value: '105', icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
    { name: 'On Leave', value: '7', icon: Briefcase, color: 'bg-rose-100 text-rose-600' },
    { name: 'Pending Approvals', value: '12', icon: FileText, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Administration</h1>
          <p className="text-gray-500 mt-1">HR, Payroll, and Staff Management.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-xl ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" /> Recent Employee Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">AK</div>
                    <span className="font-medium text-gray-900">Amit Kumar</span>
                  </td>
                  <td className="p-4 text-gray-600">Science</td>
                  <td className="p-4 text-gray-600">Senior Teacher</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span></td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">SP</div>
                    <span className="font-medium text-gray-900">Sneha Patel</span>
                  </td>
                  <td className="p-4 text-gray-600">Administration</td>
                  <td className="p-4 text-gray-600">Accountant</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span></td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">RS</div>
                    <span className="font-medium text-gray-900">Rahul Singh</span>
                  </td>
                  <td className="p-4 text-gray-600">Transport</td>
                  <td className="p-4 text-gray-600">Driver</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">On Leave</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Leave Requests</h2>
          <div className="space-y-4">
             <div className="p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
               <div className="flex justify-between items-start mb-2">
                 <p className="font-medium text-gray-900">Priya Sharma</p>
                 <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">2 Days</span>
               </div>
               <p className="text-sm text-gray-500 mb-4">Sick Leave for Medical Appointment</p>
               <div className="flex gap-2">
                 <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-1.5 rounded-lg text-sm font-medium transition-colors">Approve</button>
                 <button className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-1.5 rounded-lg text-sm font-medium transition-colors">Reject</button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administration;
