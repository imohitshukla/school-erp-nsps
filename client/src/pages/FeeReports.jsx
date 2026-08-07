import React from 'react';
import { IndianRupee, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeeReports = () => {
  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center space-x-2">
          <IndianRupee size={24} className="text-indigo-800" />
          <h1 className="text-xl font-bold text-gray-800">Fee Management</h1>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0 text-sm">
          <TopNavDropdown label="Fee Masters" />
          <TopNavDropdown label="Cheque" />
          <Link to="/fees/daily-collection">
            <TopNavButton label="Fee Reports" />
          </Link>
          <Link to="/fees/payment">
            <TopNavButton label="Fee Payment" />
          </Link>
          <TopNavDropdown label="Concession" />
          <TopNavDropdown label="Refund" />
          <TopNavDropdown label="Voucher" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Collection Column */}
        <div className="flex flex-col space-y-2">
          <div className="bg-[#a3e635] text-white p-4 font-bold text-lg flex justify-between items-center shadow-sm">
            <span>Collection</span>
            <span className="text-white opacity-70">💰</span>
          </div>
          <Link to="/fees/daily-collection" className="bg-gray-50 hover:bg-gray-100 p-3 text-sm text-gray-700 font-medium border border-gray-200 transition-colors">
            Daily Collection Report
          </Link>
          <ReportLink title="HeadWise Daily Collection" />
          <ReportLink title="HeadWise Daily Summary" />
          <ReportLink title="Yearly HeadWise Paid Summary" />
          <ReportLink title="Date Wise Class / Installment Summary" />
          <ReportLink title="Complete Paid Report" />
          <ReportLink title="Online Fee Transaction" />
        </div>

        {/* Dues Column */}
        <div className="flex flex-col space-y-2">
          <div className="bg-[#f87171] text-white p-4 font-bold text-lg flex justify-between items-center shadow-sm">
            <span>Dues</span>
            <span className="text-white opacity-70">💸</span>
          </div>
          <ReportLink title="Yearly HeadWise Dues Summary" />
          <ReportLink title="Outstanding Due Summary" />
          <ReportLink title="Complete Outstanding Dues" />
          <ReportLink title="Consolidated Dues Report" />
          <ReportLink title="Fee Student Follow Up" />
        </div>

        {/* Student Column */}
        <div className="flex flex-col space-y-2">
          <div className="bg-[#fbbf24] text-white p-4 font-bold text-lg flex justify-between items-center shadow-sm">
            <span>Student</span>
            <span className="text-white opacity-70">👨‍🎓</span>
          </div>
          <ReportLink title="Student Payments" />
          <ReportLink title="Student Hostel Report" />
          <ReportLink title="Student Head Wise Fee Report" />
          <ReportLink title="Group Wise Student" />
          <ReportLink title="Student Ledger Report" />
          <ReportLink title="Fee Agreement" />
          <ReportLink title="Student Wallet Report" />
        </div>

        {/* General Column */}
        <div className="flex flex-col space-y-2">
          <div className="bg-[#38bdf8] text-white p-4 font-bold text-lg flex justify-between items-center shadow-sm">
            <span>General</span>
            <span className="text-white opacity-70">📰</span>
          </div>
          <ReportLink title="Class / Installment Wise Summary" />
          <ReportLink title="Fee Cancellation Report" />
          <ReportLink title="Summary Report" />
          <ReportLink title="Daily Online Fee Payment" />
          <ReportLink title="Special Fee Type Report" />
          <ReportLink title="Guardian Wise Due Report" />
        </div>

      </div>

    </div>
  );
};

const ReportLink = ({ title }) => (
  <a href="#" className="bg-gray-50 hover:bg-gray-100 p-3 text-sm text-gray-700 font-medium border border-gray-200 transition-colors block">
    {title}
  </a>
);

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

export default FeeReports;
