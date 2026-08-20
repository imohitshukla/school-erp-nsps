import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Settings, MessageSquare, 
  IndianRupee, Sliders, Monitor, User, HeadphonesIcon, 
  HelpCircle, MessageCircle, FileText, ShoppingCart, Database,
  ClipboardList, Users, Tags, ClipboardCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Staff & HR', path: '/staff-hr', icon: Users },
    { name: 'Expense Management', path: '/expenses', icon: Tags },
    { name: 'Visitor Log', path: '/visitors', icon: ClipboardCheck },
    { name: 'Academic', path: '/academic', icon: BookOpen },
    { name: 'Administration', path: '/admin', icon: Settings },
    { name: 'Communication', path: '/communication', icon: MessageSquare },
    { name: 'Financial', path: '/fees/dashboard', icon: IndianRupee },
    { name: 'Fee Structure Setup', path: '/fees/setup', icon: Sliders },
    { name: 'Manual Fee Entry', path: '/fees/manual-entry', icon: ClipboardList },
    { name: 'Data Management', path: '/data', icon: Database },
    { name: 'Setup Your School', path: '/setup', icon: Sliders },
    { name: 'Website Builder', path: '/website', icon: Monitor },
    { name: 'My Details', path: '/profile', icon: User },
    { name: 'Staff Support', path: '/staff-support', icon: HeadphonesIcon },
    { name: 'Student Support', path: '/student-support', icon: HelpCircle },
    { name: 'Buy SMS', path: '/sms', icon: MessageCircle },
    { name: 'Billing', path: '/billing', icon: IndianRupee },
    { name: 'Buy Services', path: '/services', icon: ShoppingCart },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-50 border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out flex flex-col h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs text-indigo-600 font-medium mb-1">School Code: nsps</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => { if(window.innerWidth < 1024) closeSidebar() }}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-6 py-2.5 text-sm transition-colors
                  ${isActive 
                    ? 'bg-indigo-600 text-white rounded-r-full mr-4 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
