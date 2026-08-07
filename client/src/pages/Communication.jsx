import React from 'react';
import { MessageSquare, Send, Smartphone, Mail, Bell } from 'lucide-react';

const Communication = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Communication Center</h1>
          <p className="text-gray-500 mt-1">Send SMS, Emails, and manage school notices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <Smartphone className="w-8 h-8 mb-4 text-indigo-100" />
          <h3 className="text-lg font-semibold mb-1">Send SMS</h3>
          <p className="text-indigo-100 text-sm mb-4">Instantly notify parents about fees, attendance, or emergencies.</p>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
            Compose SMS
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <Mail className="w-8 h-8 mb-4 text-purple-100" />
          <h3 className="text-lg font-semibold mb-1">Send Email</h3>
          <p className="text-purple-100 text-sm mb-4">Send detailed newsletters, reports, and circulars.</p>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
            Compose Email
          </button>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <Bell className="w-8 h-8 mb-4 text-emerald-100" />
          <h3 className="text-lg font-semibold mb-1">Notice Board</h3>
          <p className="text-emerald-100 text-sm mb-4">Publish notices to the student and teacher portals.</p>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
            Add Notice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Send className="w-5 h-5 mr-2 text-indigo-500" /> Recent Communications
        </h2>
        <div className="divide-y divide-gray-100">
          <div className="py-4 flex justify-between items-center group">
            <div className="flex items-start gap-4">
              <div className="mt-1 w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Fee Reminder for Q2</p>
                <p className="text-sm text-gray-500 line-clamp-1 max-w-lg">Dear Parents, please be reminded that the fee for the second quarter is due on...</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">All Parents</span>
                  <span>Delivered to 450 recipients</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 whitespace-nowrap">Aug 06, 10:30 AM</div>
          </div>
          
          <div className="py-4 flex justify-between items-center group">
            <div className="flex items-start gap-4">
              <div className="mt-1 w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Bell size={18} />
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">School Closed for Independence Day</p>
                <p className="text-sm text-gray-500 line-clamp-1 max-w-lg">The school will remain closed on August 15th to celebrate Independence Day...</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Notice Board</span>
                  <span>Active</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 whitespace-nowrap">Aug 05, 02:15 PM</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communication;
