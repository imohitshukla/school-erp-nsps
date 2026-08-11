import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const PlaceholderPage = () => {
  const location = useLocation();
  
  // Format the path to a readable title
  const pathParts = location.pathname.split('/').filter(p => p);
  const title = pathParts.length > 0 
    ? pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')).join(' - ')
    : 'Feature';

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in-95 duration-700">
      <div className="bg-gradient-to-b from-indigo-50 to-white w-full max-w-3xl rounded-3xl p-12 text-center border border-indigo-100/50 shadow-xl shadow-indigo-100/20 relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-indigo-50 flex items-center justify-center text-indigo-500 mb-6">
            <Sparkles size={32} />
          </div>
          
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            {title}
          </h1>
          
          <p className="text-lg text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
            This module is currently being polished by our team to bring you the best possible experience. The full dashboard and features will be unlocked here very soon.
          </p>

          <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between max-w-md w-full text-left group hover:border-indigo-200 transition-colors cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Want early access?</p>
              <p className="text-xs text-gray-500 mt-0.5">Contact support to join the beta program.</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
