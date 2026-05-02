
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DB } from '../services/db';
import { AIService } from '../services/ai';
import { Task, ActivityLog, TaskStatus, Role, PerformanceReport, AttendanceRecord } from '../types';
import { Users, CheckCircle, AlertCircle, Briefcase, Calendar, BrainCircuit, Sparkles, UserCheck, UserX, Clock } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    employees: 0, 
    active: 0, 
    completed: 0, 
    overdue: 0,
    present: 0,
    absent: 0,
    late: 0
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    const tasks = DB.tasks.getAll();
    const employees = DB.users.getAll().filter(u => u.isActive && !u.isBot); // Only real active employees
    const activityLogs = DB.logs.getAll();
    const attendance = DB.attendance.getAll();

    // Attendance Calculations for Today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = attendance.filter(r => r.date === todayStr);
    
    // Present: Anyone with a record today
    const presentCount = todayRecords.length;
    
    // Late: Check-in after 9:00 AM (Simple rule)
    const lateCount = todayRecords.filter(r => {
        if (!r.checkIn) return false;
        const checkInDate = new Date(r.checkIn);
        return checkInDate.getHours() > 9 || (checkInDate.getHours() === 9 && checkInDate.getMinutes() > 0);
    }).length;

    // Absent: Total Employees - Present
    const absentCount = Math.max(0, employees.length - presentCount);

    if (user?.role === Role.ADMIN) {
        // Admin Stats
        setStats({
            employees: employees.length,
            active: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PENDING).length,
            completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
            overdue: tasks.filter(t => t.status === TaskStatus.OVERDUE).length,
            present: presentCount,
            absent: absentCount,
            late: lateCount
        });
        setLogs(activityLogs.slice(0, 5));
    } else {
        // Employee Stats
        const myTasks = tasks.filter(t => t.assignedToId === user?.id);
        setEmployeeTasks(myTasks);
        setStats({
            employees: 0, // Not relevant
            active: myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PENDING).length,
            completed: myTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
            overdue: myTasks.filter(t => t.status === TaskStatus.OVERDUE).length,
            present: presentCount, // User can see general stats or just ignored
            absent: absentCount,
            late: lateCount
        });
        setLogs(activityLogs.filter(l => l.userId === user?.id).slice(0, 5));
    }
  }, [user]);

  const handleAiAnalysis = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    // Gather tasks to send to AI
    const tasksToAnalyze = user.role === Role.ADMIN ? DB.tasks.getAll() : employeeTasks;
    const report = await AIService.analyzePerformance(tasksToAnalyze, user.fullName);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition hover:shadow-lg hover:-translate-y-1 duration-300">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl bg-opacity-10 dark:bg-opacity-20 ${color.bg}`}>
        <Icon className={color.text} size={28} />
      </div>
    </div>
  );

  const data = [
    { name: t('pending'), value: stats.active - stats.overdue },
    { name: t('completed'), value: stats.completed },
    { name: t('overdue'), value: stats.overdue },
  ];
  const COLORS = ['#3b82f6', '#10b981', '#ef4444'];

  const isAdmin = user?.role === Role.ADMIN;

  const getStatusColor = (s: TaskStatus) => {
    switch(s) {
        case TaskStatus.COMPLETED: 
            return 'text-green-600 dark:text-green-400';
        case TaskStatus.IN_PROGRESS: 
            return 'text-blue-600 dark:text-blue-400';
        case TaskStatus.PENDING: 
            return 'text-yellow-600 dark:text-yellow-400';
        case TaskStatus.OVERDUE: 
            return 'text-red-600 dark:text-red-400';
        default: return 'text-slate-600';
    }
  };

  // Helper for Performance Color
  const getPerformanceColor = (level: string) => {
      if (level === 'Excellent') return 'text-green-500';
      if (level === 'Good') return 'text-blue-500';
      if (level === 'Needs Improvement') return 'text-orange-500';
      return 'text-red-500';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {isAdmin ? t('dashboard') : `Welcome back, ${user?.fullName.split(' ')[0]}`}
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
             {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin && <StatCard title={t('stats_employees')} value={stats.employees} icon={Users} color={{ bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' }} />}
        <StatCard title={isAdmin ? t('stats_active_tasks') : "My Active Tasks"} value={stats.active} icon={Briefcase} color={{ bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' }} />
        <StatCard title={isAdmin ? t('stats_completed') : "My Completed"} value={stats.completed} icon={CheckCircle} color={{ bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400' }} />
        <StatCard title={isAdmin ? t('stats_late') : "My Overdue"} value={stats.overdue} icon={AlertCircle} color={{ bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400' }} />
      </div>

      {/* Attendance Stats Grid (Admin Only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title={t('stats_present')} value={stats.present} icon={UserCheck} color={{ bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' }} />
            <StatCard title={t('stats_late_today')} value={stats.late} icon={Clock} color={{ bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' }} />
            <StatCard title={t('stats_absent')} value={stats.absent} icon={UserX} color={{ bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">{t('task_completion')}</h3>
          <div className="h-64 relative">
             {data.every(d => d.value === 0) ? (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-400">No data available</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                </PieChart>
                </ResponsiveContainer>
             )}
          </div>
          <div className="flex justify-center gap-6 text-sm mt-4">
             {data.map((d, i) => (
                 <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                     <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: COLORS[i]}}></div>
                     <span>{d.name}</span>
                 </div>
             ))}
          </div>
        </div>

        {/* AI Performance Analysis Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                        <BrainCircuit className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('ai_analysis_title')}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Powered by GPT AI</p>
                    </div>
                </div>
                <button 
                    onClick={handleAiAnalysis} 
                    disabled={isAnalyzing}
                    className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                    {isAnalyzing ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            {t('analyzing')}
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} /> {t('analyze_btn')}
                        </>
                    )}
                </button>
            </div>
            
            {aiReport ? (
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border border-slate-100 dark:border-slate-700 animate-fade-in">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-600" />
                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className={getPerformanceColor(aiReport.level)} strokeDasharray={`${aiReport.score * 2.26} 226`} />
                            </svg>
                            <span className="absolute text-xl font-bold text-slate-800 dark:text-white">{aiReport.score}</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('score')}</p>
                            <h4 className={`text-xl font-bold ${getPerformanceColor(aiReport.level)}`}>{aiReport.level}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{aiReport.summary}</p>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 text-sm">{t('suggestions')}:</h5>
                        <ul className="space-y-1">
                            {aiReport.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="text-purple-500 mt-1">•</span> {suggestion}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                    <Sparkles size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Click "Analyze My Performance" to get an AI evaluation of your tasks.</p>
                </div>
            )}
        </div>
      </div>
      
      {/* Activity / Tasks List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">
              {isAdmin ? t('recent_activity') : "My Pending Tasks"}
          </h3>
          <div className="space-y-4">
            {isAdmin ? (
                logs.map(log => (
                <div key={log.id} className="flex items-start gap-4 pb-3 border-b border-slate-50 dark:border-slate-700 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.details}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                ))
            ) : (
                employeeTasks.filter(t => t.status !== TaskStatus.COMPLETED).slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                             <div className={`w-1 h-8 rounded-full ${task.priority === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                             <div>
                                 <p className="font-medium text-slate-800 dark:text-white">{task.title}</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString()}
                                 </p>
                             </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-white dark:bg-slate-600 shadow-sm ${getStatusColor(task.status)}`}>
                            {task.priority}
                        </span>
                    </div>
                ))
            )}
            
            {(isAdmin && logs.length === 0) && <p className="text-slate-400 text-sm">No activity recorded yet.</p>}
            {(!isAdmin && employeeTasks.length === 0) && <p className="text-slate-400 text-sm">No pending tasks. Great job!</p>}
          </div>
        </div>
    </div>
  );
};
