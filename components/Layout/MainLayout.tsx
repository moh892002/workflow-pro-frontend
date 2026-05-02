import React from 'react';
import { Sidebar } from './Sidebar';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  const { toggleLanguage, lang } = useLanguage();

  // Date Format: 4/Dec/2025
  const formattedDate = new Date()
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/ /g, '/');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 transition-all duration-300 ltr:ml-64 rtl:mr-64">
        <header className="bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
           {/* Date Display - Left aligned in LTR, Right in RTL via flex-between context usually, but here specific placement */}
           <div className="text-xl font-bold text-slate-700 dark:text-slate-200 tracking-wide font-mono">
              {formattedDate}
           </div>

           <div className="flex items-center gap-4">
             <ThemeToggle />
             <button 
               onClick={toggleLanguage}
               className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
             >
               <Globe size={16} />
               <span className="text-sm font-medium uppercase">{lang}</span>
             </button>
           </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};