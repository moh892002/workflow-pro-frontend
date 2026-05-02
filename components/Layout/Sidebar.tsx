
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CheckSquare, FileText, LogOut, Briefcase, MessageSquare, DollarSign, Trash2, UserCircle } from 'lucide-react';
import { Role } from '../../types';
import { DB } from '../../services/db';

export const Sidebar = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user?.role === Role.ADMIN;
  const isHR = user?.role === Role.HR_MANAGER;
  
  const canViewEmployees = isAdmin || isHR;
  const canViewReports = isAdmin || isHR;
  const canViewFinance = isAdmin || isHR;
  const canViewBin = isAdmin || isHR;

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
        const count = DB.messages.getUnreadCount(user.id);
        setUnreadCount(count);
    }, 2000);
    setUnreadCount(DB.messages.getUnreadCount(user.id));
    return () => clearInterval(interval);
  }, [user]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 relative ${
      isActive
        ? 'bg-accent text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <div className="h-screen w-64 bg-primary dark:bg-slate-900 text-white flex flex-col fixed left-0 top-0 rtl:right-0 rtl:left-auto z-20 border-r border-slate-800 dark:border-slate-800 transition-colors duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="p-2 bg-accent rounded-lg">
          <Briefcase size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">WorkFlow Pro</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink to="/" className={linkClass}>
          <LayoutDashboard size={20} />
          <span>{t('dashboard')}</span>
        </NavLink>

        {canViewEmployees && (
          <NavLink to="/employees" className={linkClass}>
            <Users size={20} />
            <span>{t('employees')}</span>
          </NavLink>
        )}

        <NavLink to="/tasks" className={linkClass}>
          <CheckSquare size={20} />
          <span>{t('tasks')}</span>
        </NavLink>
        
        {canViewFinance && (
          <NavLink to="/finance" className={linkClass}>
            <DollarSign size={20} />
            <span>{t('finance')}</span>
          </NavLink>
        )}

        <NavLink to="/chat" className={linkClass}>
          <div className="relative"><MessageSquare size={20} /></div>
          <span>Chat</span>
          {unreadCount > 0 && (
             <span className="absolute right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                 {unreadCount > 99 ? '99+' : unreadCount}
             </span>
          )}
        </NavLink>

        {canViewReports && (
          <NavLink to="/reports" className={linkClass}>
            <FileText size={20} />
            <span>{t('reports')}</span>
          </NavLink>
        )}

        {canViewBin && (
          <NavLink to="/recycle-bin" className={linkClass}>
            <Trash2 size={20} />
            <span>{t('recycle_bin')}</span>
          </NavLink>
        )}

        <NavLink to="/profile" className={linkClass}>
            <UserCircle size={20} />
            <span>{t('my_profile')}</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-4 px-2">
            <img 
                src={user?.profileImage || 'https://via.placeholder.com/40'} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-accent object-cover"
            />
            <div className="overflow-hidden">
                <p className="text-sm font-medium truncate text-slate-200">{user?.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-400 hover:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <LogOut size={20} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};