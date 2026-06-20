import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FinancialRecord, TransactionType, DEPARTMENTS } from '../types';
import { DollarSign, Plus, Trash2, Download, Search } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import { useFinanceRecords, useCreateFinanceRecord, useDeleteFinanceRecord } from '../hooks/queries/useFinance';
import { useCreateActivityLog } from '../hooks/queries/useActivityLogs';

const TX_TYPE_REVERSE: Record<string, string> = {
  [TransactionType.SALARY]: 'salary',
  [TransactionType.BONUS]: 'bonus',
  [TransactionType.DEDUCTION]: 'deduction',
  [TransactionType.ADVANCE]: 'advance',
  [TransactionType.OVERTIME]: 'overtime',
};

export const Finance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data, isLoading } = useFinanceRecords();
  const createRecord = useCreateFinanceRecord();
  const deleteRecord = useDeleteFinanceRecord();
  const createLog = useCreateActivityLog();

  const records = data?.records || [];
  const employees = data?.employees || [];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState<Partial<FinancialRecord>>({
      type: TransactionType.SALARY,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
  });

  const handleDelete = async (id: string) => {
      if (!user) return;
      if (!confirm("Move to Recycle Bin?")) return;
      try {
        await deleteRecord.mutateAsync(id);
      } catch {
        alert('Failed to delete record');
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !formData.employeeId || !formData.amount) return;

      try {
        await createRecord.mutateAsync({
          user_id: formData.employeeId,
          transaction_type: TX_TYPE_REVERSE[formData.type || TransactionType.SALARY],
          amount: Number(formData.amount),
          transaction_date: formData.date || new Date().toISOString().split('T')[0],
          notes: formData.notes || '',
        });

        const emp = employees.find(e => e.id === formData.employeeId);
        await createLog.mutateAsync({
          user_id: user.id,
          action: 'ADD_FINANCE',
          details: `Added ${formData.type} ($${formData.amount}) for ${emp?.fullName || formData.employeeId}`,
        });

        setIsModalOpen(false);
      } catch {
        alert('Failed to add record');
      }
  };

  const filteredRecords = useMemo(() => records.filter(r => {
      const matchDept = filterDept ? r.department === filterDept : true;
      const matchType = filterType ? r.type === filterType : true;
      const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchType && matchSearch;
  }), [records, filterDept, filterType, search]);

  const totalAmount = useMemo(() => filteredRecords.reduce((acc, curr) => acc + curr.amount, 0), [filteredRecords]);

  return (
    <div className="animate-fade-in space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <DollarSign className="text-green-600" /> {t('finance_records')}
               </h2>
               <p className="text-sm text-slate-500">Secure Financial Management</p>
           </div>
           <div className="flex gap-2">
               <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium">
                   <Download size={16} /> Export
               </button>
               <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg shadow-green-600/20">
                   <Plus size={16} /> {t('add_record')}
               </button>
           </div>
       </div>

       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="relative">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input
                 className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                 placeholder="Search Employee..."
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
           </div>
           <select className="p-2 rounded-lg border dark:border-slate-600 bg-slate-50 dark:bg-slate-700" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
               <option value="">All Departments</option>
               {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
           <select className="p-2 rounded-lg border dark:border-slate-600 bg-slate-50 dark:bg-slate-700" value={filterType} onChange={e => setFilterType(e.target.value)}>
               <option value="">All Types</option>
               {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
           </select>
           <div className="flex items-center justify-end px-4 font-bold text-slate-700 dark:text-slate-300">
               Total: <span className="ml-2 text-green-600">${totalAmount.toLocaleString()}</span>
           </div>
       </div>

       {isLoading ? (
         <TableSkeleton rows={6} />
       ) : (
         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left rtl:text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-medium">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Notes</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredRecords.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-4">{rec.date}</td>
                            <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{rec.employeeName}</td>
                            <td className="p-4 text-slate-500">{rec.department}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    rec.type === TransactionType.DEDUCTION ? 'bg-red-100 text-red-700' :
                                    rec.type === TransactionType.BONUS ? 'bg-green-100 text-green-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {rec.type}
                                </span>
                            </td>
                            <td className="p-4 font-mono font-bold">${rec.amount.toLocaleString()}</td>
                            <td className="p-4 text-slate-500 max-w-xs truncate">{rec.notes}</td>
                            <td className="p-4 text-right">
                                <button onClick={() => handleDelete(rec.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">No records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
       )}

       {isModalOpen && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl">
                   <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{t('add_record')}</h3>
                   <form onSubmit={handleSubmit} className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium mb-1">{t('select_employee')}</label>
                           <select required className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                               <option value="">-- Select --</option>
                               {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                           </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium mb-1">{t('transaction_type')}</label>
                               <select required className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}>
                                   {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                           </div>
                           <div>
                               <label className="block text-sm font-medium mb-1">{t('amount')}</label>
                               <input required type="number" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium mb-1">{t('date')}</label>
                           <input required type="date" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-sm font-medium mb-1">{t('notes')}</label>
                           <textarea className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                       </div>
                       <div className="flex justify-end gap-3 mt-4">
                           <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">{t('cancel')}</button>
                           <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">{t('save')}</button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};
export default Finance;
