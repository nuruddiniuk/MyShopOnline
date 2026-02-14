
import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  currentPage: string;
  setCurrentPage: (p: string) => void;
  onLogout: () => void;
  lang: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, setCurrentPage, onLogout, lang, setIsOpen }) => {
  const t = TRANSLATIONS[lang];

  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: t.dashboard },
    { id: 'inventory', icon: 'fa-boxes-stacked', label: t.inventory },
    { id: 'sales', icon: 'fa-cart-shopping', label: t.sales },
    { id: 'customers', icon: 'fa-users', label: t.customers },
    { id: 'expenses', icon: 'fa-file-invoice-dollar', label: t.expenses },
    { id: 'reports', icon: 'fa-chart-line', label: t.reports },
    { id: 'settings', icon: 'fa-gear', label: t.settings },
  ];

  return (
    <aside className={`
      fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 transform
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      flex flex-col
    `}>
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white">
          <i className="fa-solid fa-store"></i>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">MyShop</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentPage(item.id);
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium
              ${currentPage === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'hover:bg-slate-800 hover:text-white'}
            `}
          >
            <i className={`fa-solid ${item.icon} w-5`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">Version 1.0 Stable</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
