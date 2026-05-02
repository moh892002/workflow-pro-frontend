
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DB } from '../services/db';
import { Task, TaskPriority, TaskStatus, User, Role } from '../types';
import { Plus, Search, Calendar, User as UserIcon, Trash2 } from 'lucide-react';

export const Tasks = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const [newTask, setNewTask] = useState<Partial<Task>>({
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING
  });

  const canCreate = user?.role === Role.ADMIN || user?.role === Role.HR_MANAGER || user?.role === Role.OPS_MANAGER;
  const isAdmin = user?.role === Role.ADMIN;

  const refreshData = () => {
    setTasks(DB.tasks.getAll());
    setUsers(DB.users.getAll());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedToId || !newTask.deadline) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || '',
      assignedToId: newTask.assignedToId,
      assignedById: user!.id,
      priority: newTask.priority as TaskPriority,
      status: TaskStatus.PENDING,
      deadline: newTask.deadline,
      progress: 0,
      createdAt: new Date().toISOString()
    };

    DB.tasks.add(task);
    DB.logs.add({
      id: Date.now().toString(),
      userId: user!.id,
      action: 'CREATE_TASK',
      timestamp: new Date().toISOString(),
      details: `Created task: ${task.title}`
    });

    setIsModalOpen(false);
    refreshData();
    setNewTask({ priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING });
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updated = { ...task, status: newStatus, progress: newStatus === TaskStatus.COMPLETED ? 100 : task.progress };
      DB.tasks.update(updated);
      refreshData();
    }
  };

  const handleDelete = (id: string) => {
      if (!user || !isAdmin) return;
      if (confirm("Move this task to Recycle Bin?")) {
          DB.tasks.delete(id, user);
          refreshData();
      }
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(filter.toLowerCase()) &&
    (user?.role === Role.ADMIN || task.assignedToId === user?.id || task.assignedById === user?.id)
  );

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
        case TaskPriority.CRITICAL: return 'bg-red-100 text-red-700 border-red-200';
        case TaskPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
        case TaskPriority.MEDIUM: return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (s: TaskStatus) => {
    switch(s) {
        case TaskStatus.COMPLETED: 
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500 dark:text-white dark:border-green-600';
        case TaskStatus.IN_PROGRESS: 
            return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500 dark:text-white dark:border-blue-600';
        case TaskStatus.PENDING: 
            return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500 dark:text-black dark:border-yellow-600'; 
        case TaskStatus.OVERDUE: 
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-600 dark:text-white dark:border-red-700';
        default: 
            return 'bg-slate-100';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('tasks')}</h2>
        {canCreate && (
          <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-900/20">
            <Plus size={20} />
            {t('create_task')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400 rtl:right-3 rtl:left-auto" size={20} />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-accent rtl:pr-10 rtl:pl-4"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTasks.map(task => {
            const assignee = users.find(u => u.id === task.assignedToId);
            return (
                <div key={task.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2">{task.title}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-3 py-1 rounded-md border shadow-sm ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                                {isAdmin && (
                                    <button onClick={() => handleDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500 transition">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            
                            <select 
                                value={task.status} 
                                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-accent"
                            >
                                <option value={TaskStatus.PENDING}>{t('pending')}</option>
                                <option value={TaskStatus.IN_PROGRESS}>{t('in_progress')}</option>
                                <option value={TaskStatus.COMPLETED}>{t('completed')}</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">{task.description}</p>
                    <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-700 pt-4">
                        <div className="flex items-center gap-2">
                            <UserIcon size={16} />
                            <span>{assignee?.fullName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{t('create_task')}</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('title')}</label>
                <input required type="text" className="w-full border dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('description')}</label>
                <textarea className="w-full border dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" rows={3} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('priority')}</label>
                  <select className="w-full border dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})}>
                    <option value={TaskPriority.LOW}>{t('low')}</option>
                    <option value={TaskPriority.MEDIUM}>{t('medium')}</option>
                    <option value={TaskPriority.HIGH}>{t('high')}</option>
                    <option value={TaskPriority.CRITICAL}>{t('critical')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('assign_to')}</label>
                  <select required className="w-full border dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setNewTask({...newTask, assignedToId: e.target.value})}>
                    <option value="">Select Employee</option>
                    {users.filter(u => u.role !== Role.ADMIN).map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('deadline')}</label>
                <input required type="date" className="w-full border dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
