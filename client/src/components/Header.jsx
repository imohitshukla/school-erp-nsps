import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, UserCircle, HelpCircle, QrCode, Briefcase, IndianRupee, UserPlus, FileText, Users, UserCheck, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { selectedAcademicYear, setSelectedAcademicYear } = useAppContext();
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const academicYears = [
    '2021-2022',
    '2022-2023',
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028'
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex flex-col bg-white shadow-sm z-10 sticky top-0 font-sans">
      {/* Top Bar - Modernized with gradients and glassmorphism hints */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white px-4 py-2.5 flex justify-between items-center h-14 shadow-md">
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-1.5 hover:bg-white/20 rounded-md transition-colors"
          >
            <Menu size={20} />
          </button>
          
          {/* Logo Section */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20 shadow-sm flex items-center justify-center">
              <span className="text-white font-extrabold text-xs tracking-wider">ERP</span>
            </div>
            <span className="font-semibold text-[15px] hidden sm:block tracking-wide">
              New Sainik Public School
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-5 text-sm">
          
          <button className="hidden sm:flex items-center space-x-1.5 text-indigo-100 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <HelpCircle size={15} />
            <span className="font-medium">Support</span>
          </button>
          
          <div className="hidden sm:block border-r border-indigo-400/50 h-5"></div>
          
          {/* Academic Year Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center space-x-1 bg-white/5 px-3 py-1.5 rounded-md border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">{selectedAcademicYear}</span>
              <ChevronDown size={14} className="opacity-70" />
            </div>
            
            {showYearDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50 text-gray-700">
                {academicYears.map(year => (
                  <div 
                    key={year}
                    onClick={() => {
                      setSelectedAcademicYear(year);
                      setShowYearDropdown(false);
                    }}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${selectedAcademicYear === year ? 'text-indigo-600 font-medium bg-indigo-50/50' : ''}`}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="hidden sm:flex relative p-1.5 hover:bg-white/10 rounded-full transition-colors text-indigo-100 hover:text-white">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full border border-indigo-600"></span>
          </button>

          <div className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity pl-2">
            <div className="bg-gradient-to-tr from-orange-400 to-pink-500 rounded-full p-0.5 shadow-sm">
              <div className="bg-white rounded-full p-0.5">
                <UserCircle size={24} className="text-indigo-600" />
              </div>
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <div className="font-semibold text-sm">{user.username === 'admin' ? 'Pradeep Kumar' : user.username}</div>
              <div className="text-[10px] text-indigo-200 font-medium tracking-wider uppercase">{user.role || 'Admin'}</div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center p-1.5 hover:bg-red-500/20 text-indigo-100 hover:text-red-100 rounded-md transition-all ml-2"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Secondary Module Header - Cleaner styling */}
      <div className="flex items-center px-6 py-2 overflow-x-auto no-scrollbar border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm shadow-sm">
        <div className="flex items-center space-x-3 mr-8 shrink-0">
          <span className="font-semibold text-gray-700 text-sm">Welcome back, {user.username === 'admin' ? 'Pradeep' : user.username}</span>
          <span className="text-gray-400 text-xs hidden sm:inline">|</span>
          <span className="text-gray-500 text-xs hidden sm:inline">Here's what's happening today.</span>
        </div>

        <div className="flex space-x-7 shrink-0 ml-auto items-center">
          <ModuleLink icon={<QrCode size={18} className="text-blue-500" />} label="QR Posters" path="#" active={false} />
          <ModuleLink icon={<Briefcase size={18} className="text-amber-500" />} label="Post Jobs" path="#" active={false} />
          <ModuleLink icon={<IndianRupee size={18} className="text-emerald-500" />} label="Fee" path="/fees/dashboard" active={location.pathname.includes('/fees')} />
          <ModuleLink icon={<UserPlus size={18} className="text-rose-500" />} label="Admission" path="#" active={false} />
          <ModuleLink icon={<FileText size={18} className="text-violet-500" />} label="Account" path="#" active={false} />
          <ModuleLink icon={<Users size={18} className="text-indigo-500" />} label="Student" path="/dashboard" active={location.pathname === '/dashboard'} />
          <ModuleLink icon={<UserCheck size={18} className="text-orange-500" />} label="Staff" path="#" active={false} />
        </div>
      </div>
    </div>
  );
};

const ModuleLink = ({ icon, label, active, path }) => (
  <Link 
    to={path} 
    className={`
      flex flex-col items-center justify-center space-y-1.5 pb-1.5 transition-all
      ${active 
        ? 'text-indigo-700 border-b-2 border-indigo-600 scale-105 font-bold' 
        : 'text-gray-500 hover:text-indigo-600 hover:scale-105 font-medium'
      }
    `}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-wider">{label}</span>
  </Link>
);

export default Header;
