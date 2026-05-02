
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DB } from '../services/db';
import { RecycleBinItem, Role } from '../types';
import { Trash2, RotateCcw, AlertOctagon, User, FileText, CheckSquare, DollarSign } from 'lucide-react';
import { DeletionModal } from '../components/DeletionModal';

export const RecycleBin = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecycleBinItem | null>(null);

  const isAdmin = user?.role === Role.ADMIN;

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setItems(DB.recycleBin.getAll().reverse());
  };

  const handleRestore = (id: string) => {
    if (!isAdmin) return;
    DB.recycleBin.restore(id);
    refresh();
  };

  const initiateHardDelete = (item: RecycleBinItem) => {
    if (!isAdmin) return;
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const confirmHardDelete = () => {
    if (selectedItem && user) {
        DB.recycleBin.hardDelete(selectedItem.id, user);
        setDeleteModalOpen(false);
        setSelectedItem(null);
        refresh();
    }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'USER': return <User size={18} />;
          case 'TASK': return <CheckSquare size={18} />;
          case 'FINANCE': return <DollarSign size={18} />;
          default: return <FileText size={18} />;
      }
  };

  return (
    <div className="animate-fade-in space-y-6">
       <div className="flex items-center gap-3 mb-6 text-slate-800 dark:text-white">
           <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full">
               <Trash2 size={24} />
           </div>
           <div>
               <h2 className="text-2xl font-bold">{t('recycle_bin')}</h2>
               <p className="text-sm text-slate-500">Manage deleted items safely</p>
           </div>
       </div>

       {!isAdmin && (
           <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm border border-blue-100">
               Viewing Mode Only. Only Admins can restore or permanently delete items.
           </div>
       )}

       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
           {items.length === 0 ? (
               <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                   <Trash2 size={48} className="mb-4 opacity-20" />
                   <p>{t('recycle_bin_empty')}</p>
               </div>
           ) : (
               <table className="w-full text-left rtl:text-right text-sm">
                   <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                       <tr>
                           <th className="p-4">Type</th>
                           <th className="p-4">Original Info</th>
                           <th className="p-4">{t('deleted_by')}</th>
                           <th className="p-4">{t('deleted_at')}</th>
                           {isAdmin && <th className="p-4 text-right">Actions</th>}
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                       {items.map(item => {
                           let label = 'Unknown Item';
                           if(item.type === 'USER') label = item.data.fullName;
                           else if(item.type === 'TASK') label = item.data.title;
                           else if(item.type === 'FINANCE') label = `${item.data.type} - $${item.data.amount}`;
                           
                           return (
                               <tr key={item.id} className="bg-slate-50/50 hover:bg-white dark:hover:bg-slate-700 transition">
                                   <td className="p-4">
                                       <span className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300">
                                           {getIcon(item.type)} {item.type}
                                       </span>
                                   </td>
                                   <td className="p-4 font-medium text-slate-800 dark:text-white">{label}</td>
                                   <td className="p-4 text-slate-500">{item.deletedBy}</td>
                                   <td className="p-4 text-slate-400 text-xs">{new Date(item.deletedAt).toLocaleString()}</td>
                                   {isAdmin && (
                                       <td className="p-4 text-right flex justify-end gap-2">
                                           <button 
                                             onClick={() => handleRestore(item.id)}
                                             className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                           >
                                               <RotateCcw size={14} /> {t('restore')}
                                           </button>
                                           <button 
                                             onClick={() => initiateHardDelete(item)}
                                             className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                           >
                                               <AlertOctagon size={14} /> {t('permanent_delete')}
                                           </button>
                                       </td>
                                   )}
                               </tr>
                           );
                       })}
                   </tbody>
               </table>
           )}
       </div>

       <DeletionModal 
         isOpen={deleteModalOpen} 
         onClose={() => setDeleteModalOpen(false)} 
         onConfirm={confirmHardDelete}
         title={selectedItem?.type === 'USER' ? selectedItem.data.fullName : 'Selected Item'}
       />
    </div>
  );
};
