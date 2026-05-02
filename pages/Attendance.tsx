import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DB } from '../services/db';
import { AttendanceRecord } from '../types';
import { Clock, MapPin } from 'lucide-react';

export const Attendance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const allRecords = DB.attendance.getAll();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get History for this user
    setHistory(allRecords.filter(r => r.userId === user?.id).reverse());

    // Check today
    const existing = allRecords.find(r => r.userId === user?.id && r.date === todayStr);
    if (existing) setTodayRecord(existing);
  }, [user]);

  const handleCheckIn = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const record: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user!.id,
      date: todayStr,
      checkIn: new Date().toISOString(),
      checkOut: null,
      status: 'PRESENT'
    };
    DB.attendance.add(record);
    setTodayRecord(record);
    setHistory([record, ...history]);
  };

  const handleCheckOut = () => {
    if (!todayRecord) return;
    const updated = { ...todayRecord, checkOut: new Date().toISOString() };
    DB.attendance.update(updated);
    setTodayRecord(updated);
    setHistory(history.map(h => h.id === updated.id ? updated : h));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('attendance')}</h2>

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center mb-8">
        <h3 className="text-slate-500 font-medium mb-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
        <div className="text-5xl font-bold text-slate-800 mb-8 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {!todayRecord ? (
          <button 
            onClick={handleCheckIn}
            className="bg-accent hover:bg-accent-hover text-white text-lg font-bold px-12 py-4 rounded-full shadow-lg transition transform hover:-translate-y-1"
          >
            {t('check_in')}
          </button>
        ) : !todayRecord.checkOut ? (
          <div className="space-y-4">
            <p className="text-accent font-medium">{t('checked_in_at')} {new Date(todayRecord.checkIn!).toLocaleTimeString()}</p>
            <button 
              onClick={handleCheckOut}
              className="bg-red-500 hover:bg-red-600 text-white text-lg font-bold px-12 py-4 rounded-full shadow-lg transition"
            >
              {t('check_out')}
            </button>
          </div>
        ) : (
          <div>
            <div className="inline-block bg-green-100 text-green-700 px-6 py-2 rounded-full font-bold">
              Attendance Complete
            </div>
            <div className="flex justify-center gap-8 mt-4 text-slate-500">
               <p>{t('checked_in_at')}: {new Date(todayRecord.checkIn!).toLocaleTimeString()}</p>
               <p>{t('checked_out_at')}: {new Date(todayRecord.checkOut!).toLocaleTimeString()}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
          Attendance History
        </div>
        <table className="w-full text-left rtl:text-right">
            <thead className="text-slate-400 text-xs uppercase bg-slate-50 border-b">
                <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Check In</th>
                    <th className="p-4">Check Out</th>
                    <th className="p-4">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {history.map(rec => (
                    <tr key={rec.id}>
                        <td className="p-4">{rec.date}</td>
                        <td className="p-4 font-mono text-sm">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '-'}</td>
                        <td className="p-4 font-mono text-sm">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '-'}</td>
                        <td className="p-4"><span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">PRESENT</span></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};