import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Role, AttendanceRecord } from '../types';
import { FileText, Printer, Clock, UserX, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';

interface ReportStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  averageHours: number;
}

function toFrontendUser(data: any): User {
  return {
    id: String(data.id),
    fullName: data.fullname || '',
    username: data.username || '',
    role: data.role || Role.EMPLOYEE,
    department: data.department?.name || '',
    salary: data.salary,
    isActive: data.deleted_at === null,
    profileImage: data.image_url || `https://ui-avatars.com/api/?name=${data.fullname}&background=random`,
    jobTitle: data.job_title || '',
    isBot: false,
  };
}

export const Reports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.HR_MANAGER)) {
        navigate('/');
        return;
    }

    const abortController = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users', { signal: abortController.signal });
        const mapped = (res.data.data || []).map(toFrontendUser);
        setEmployees(mapped);
      } catch (err: any) {
        if (err?.name === 'CanceledError') return;
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();

    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);

    return () => abortController.abort();
  }, [user, navigate]);

  const generateReport = async () => {
    if (!selectedUser || !startDate || !endDate) return;

    if (user?.role === Role.HR_MANAGER && selectedUser === user.id) {
        alert("Access Denied: You are not allowed to generate your own report.");
        return;
    }

    try {
      setLoading(true);
      const res = await api.get('/reports/attendance', {
        params: { user_id: selectedUser, start_date: startDate, end_date: endDate },
      });
      const data = res.data.data;

      setStats({
        totalDays: data.stats.total_days,
        presentDays: data.stats.present_days,
        absentDays: data.stats.absent_days,
        lateDays: data.stats.late_days,
        totalHours: data.stats.total_hours,
        averageHours: data.stats.average_hours,
      });

      setReportData((data.daily_breakdown || []).map((r: any) => ({
        id: `${r.date}-${selectedUser}`,
        userId: String(data.employee.id),
        date: r.date,
        checkIn: r.check_in || null,
        checkOut: r.check_out || null,
        status: r.status || 'PRESENT',
      })));

      if (user?.role === Role.HR_MANAGER) {
        const targetUser = employees.find(e => e.id === selectedUser)?.fullName || selectedUser;
        await api.post('/activity-logs', {
          user_id: user.id,
          action: 'GENERATE_REPORT',
          details: `Generated report for employee: ${targetUser}`,
        });
      }
    } catch {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    window.print();

    if (user?.role === Role.HR_MANAGER) {
      try {
        await api.post('/activity-logs', {
          user_id: user.id,
          action: 'PRINT_REPORT',
          details: `Printed report for employee ID: ${selectedUser}`,
        });
      } catch {}
    }
  };

  const emp = employees.find(e => e.id === selectedUser);

  return (
    <div className="animate-fade-in">
      <div className="print:hidden mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="text-accent" /> {t('reports')}
        </h2>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('select_employee')}</label>
                <select
                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                >
                    <option value="">-- Select --</option>
                    {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.fullName}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('date_from')}</label>
                <input
                    type="date"
                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('date_to')}</label>
                <input
                    type="date"
                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
            <button
                onClick={generateReport}
                disabled={loading}
                className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
                {loading ? 'Loading...' : t('generate_report')}
            </button>
        </div>
      </div>

      {loading && !stats && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <Skeleton width="200px" height="24px" className="mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton variant="rect" width="100%" height="48px" />
              <Skeleton variant="rect" width="100%" height="48px" />
            </div>
            <Skeleton variant="rect" width="100%" height="120px" className="mt-4" />
          </div>
        </div>
      )}

      {stats && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 print:shadow-none print:border-0 print:p-0">
            <div className="border-b border-slate-200 dark:border-slate-600 pb-6 mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">WorkFlow Pro</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Enterprise Management System</p>
                    <h2 className="text-xl font-semibold mt-4 text-slate-700 dark:text-slate-200">{t('performance_report')}</h2>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Generated on: {new Date().toLocaleDateString()}</div>
                    <button
                        onClick={handlePrint}
                        className="print:hidden flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Printer size={16} /> {t('export_pdf')}
                    </button>
                </div>
            </div>

            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('full_name')}</span>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                            {emp?.fullName || selectedUser}
                        </p>
                    </div>
                    <div className="text-right rtl:text-left">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Period</span>
                         <p className="text-slate-800 dark:text-white font-medium">
                            {startDate} <span className="text-slate-400 mx-2">to</span> {endDate}
                         </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                        <Clock size={18} />
                        <span className="text-sm font-bold">{t('total_working_hours')}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalHours} <span className="text-xs font-normal text-slate-500">hrs</span></p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <UserCheck size={18} />
                        <span className="text-sm font-bold">{t('stats_present')}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.presentDays} <span className="text-xs font-normal text-slate-500">days</span></p>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                        <UserX size={18} />
                        <span className="text-sm font-bold">{t('total_absent')}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.absentDays} <span className="text-xs font-normal text-slate-500">days</span></p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                        <Clock size={18} />
                        <span className="text-sm font-bold">{t('total_late')}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.lateDays} <span className="text-xs font-normal text-slate-500">days</span></p>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('daily_breakdown')}</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left rtl:text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-3 font-medium">{t('date')}</th>
                            <th className="p-3 font-medium">{t('check_in')}</th>
                            <th className="p-3 font-medium">{t('check_out')}</th>
                            <th className="p-3 font-medium">{t('working_hours')}</th>
                            <th className="p-3 font-medium">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {reportData.length > 0 ? reportData.map(record => {
                             const checkIn = new Date(record.checkIn!);
                             const isLate = checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 0);
                             let hours = '-';
                             if (record.checkIn && record.checkOut) {
                                 hours = ((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 3600)).toFixed(2);
                             }

                             return (
                                <tr key={record.id} className="text-slate-700 dark:text-slate-300">
                                    <td className="p-3">{record.date}</td>
                                    <td className="p-3 font-mono">{new Date(record.checkIn!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="p-3 font-mono">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                    <td className="p-3">{hours}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isLate ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {isLate ? 'LATE' : 'PRESENT'}
                                        </span>
                                    </td>
                                </tr>
                             );
                        }) : (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-400">No records found for this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs text-slate-400">
                 <p>WorkFlow Pro - Confidential Report</p>
                 <p>Page 1 of 1</p>
            </div>
        </div>
      )}
    </div>
  );
};
export default Reports;
