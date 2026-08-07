import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
