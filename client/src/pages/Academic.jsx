import React from 'react';
import { Users, BookOpen, Clock, Calendar, Shield, Award } from 'lucide-react';

const Academic = () => {
  const stats = [
    { name: 'Total Classes', value: '24', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
    { name: 'Total Subjects', value: '45', icon: Award, color: 'bg-purple-100 text-purple-600' },
    { name: 'Active Teachers', value: '62', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Exams Scheduled', value: '8', icon: Calendar, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Academic Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage classes, subjects, and curriculum.</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Today's Timetable
          </h2>
          <div className="space-y-4">
            <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
              <div className="w-24 text-sm font-medium text-gray-500">08:00 AM</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Mathematics - Class 10A</p>
                <p className="text-sm text-gray-500">Room 101 • Mr. Sharma</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Ongoing</span>
            </div>
            <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
              <div className="w-24 text-sm font-medium text-gray-500">09:00 AM</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Physics - Class 10A</p>
                <p className="text-sm text-gray-500">Lab 2 • Mrs. Gupta</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Upcoming</span>
            </div>
            <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
              <div className="w-24 text-sm font-medium text-gray-500">10:00 AM</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Chemistry - Class 12B</p>
                <p className="text-sm text-gray-500">Lab 1 • Dr. Verma</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Upcoming</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-500" /> Recent Academic Notices
          </h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {/* Simple vertical list without complex timeline for now */}
             <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
               <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                 <BookOpen size={20} />
               </div>
               <div>
                 <p className="font-medium text-gray-900">Half-Yearly Syllabus Published</p>
                 <p className="text-sm text-gray-500 mt-1">Syllabus for classes 6 to 12 has been published on the portal.</p>
                 <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
               </div>
             </div>
             
             <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
               <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                 <Award size={20} />
               </div>
               <div>
                 <p className="font-medium text-gray-900">Science Olympiad Results</p>
                 <p className="text-sm text-gray-500 mt-1">Top performers list has been updated in the results section.</p>
                 <p className="text-xs text-gray-400 mt-2">1 day ago</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academic;
