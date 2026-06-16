import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { DB } from '../services/db';
import { User, RequestType, RequestStatus } from '../types';
import { Camera, Save, X, User as UserIcon, Briefcase, Building, Lock } from 'lucide-react';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestData, setRequestData] = useState({ type: RequestType.PASSWORD, reason: '' });

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            alert(t('upload_restriction'));
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert(t('file_too_large'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setPreviewImage(ev.target.result as string);
                setIsEditing(true);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = async () => {
      if (!previewImage || !user) return;

      const updatedUser = { ...user, profileImage: previewImage };
      updateUser(updatedUser);

      try {
        await api.post('/activity-logs', {
          user_id: user.id,
          action: 'UPDATE_PROFILE_PIC',
          details: 'User updated their profile picture',
        });
      } catch {}

      setIsEditing(false);
      setPreviewImage(null);
      alert(t('profile_updated'));
  };

  const handleCancelImage = () => {
      setPreviewImage(null);
      setIsEditing(false);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
      e.preventDefault();
      DB.requests.add({
          id: Date.now().toString(),
          userId: user.id,
          userFullName: user.fullName,
          targetUserId: user.id,
          targetUserFullName: user.fullName,
          type: requestData.type,
          reason: requestData.reason,
          status: RequestStatus.PENDING,
          createdAt: new Date().toISOString()
      });
      alert(t('request_sent'));
      setIsRequestModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('my_profile')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
                    <div className="relative group mb-4">
                        <img
                            src={previewImage || user.profileImage}
                            alt="Profile"
                            className="w-40 h-40 rounded-full object-cover border-4 border-slate-100 dark:border-slate-700 shadow-md transition-transform duration-300 group-hover:scale-105"
                        />
                        <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition text-white backdrop-blur-[2px]">
                            <Camera size={32} className="mb-2" />
                            <span className="text-xs font-medium px-2">{t('click_to_upload')}</span>
                            <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleImageSelect} />
                        </label>
                    </div>

                    {isEditing ? (
                        <div className="flex gap-2 w-full">
                            <button onClick={handleSaveImage} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                <Save size={16} /> {t('save')}
                            </button>
                            <button onClick={handleCancelImage} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                <X size={16} /> {t('cancel')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user.fullName}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{user.jobTitle}</p>
                            <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 py-2 px-4 rounded-lg border border-slate-100 dark:border-slate-700">
                                {t('upload_restriction')}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="md:col-span-2 space-y-6">

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <UserIcon size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('personal_info')}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('full_name')}</label>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">{user.fullName}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('username')}</label>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">{user.username}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Briefcase size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('job_details')}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('department')}</label>
                            <div className="flex items-center gap-2">
                                <Building size={16} className="text-slate-400" />
                                <p className="text-slate-800 dark:text-slate-200 font-medium">{user.department}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('role')}</label>
                            <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition font-medium border border-slate-200 dark:border-slate-600"
                    >
                        <Lock size={18} />
                        {t('request_change')}
                    </button>
                </div>

            </div>
        </div>

        {isRequestModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl">
                 <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{t('request_change')}</h3>
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4 text-xs text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                     <Lock size={16} className="shrink-0" />
                     <span>{t('security_warning')}</span>
                 </div>
                 <form onSubmit={handleSubmitRequest} className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('request_type')}</label>
                         <select className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" value={requestData.type} onChange={e => setRequestData({...requestData, type: e.target.value as RequestType})}>
                             <option value={RequestType.PASSWORD}>Change Password</option>
                             <option value={RequestType.USERNAME}>Change Username</option>
                             <option value={RequestType.BOTH}>Change Both</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('reason')}</label>
                         <textarea required className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" rows={3} value={requestData.reason} onChange={e => setRequestData({...requestData, reason: e.target.value})} placeholder="Why do you need this change?" />
                     </div>
                     <div className="flex justify-end gap-3">
                         <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">{t('cancel')}</button>
                         <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">{t('save')}</button>
                     </div>
                 </form>
             </div>
          </div>
        )}
    </div>
  );
};
