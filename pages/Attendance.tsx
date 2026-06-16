import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AttendanceRecord } from '../types';
import { Clock, MapPin } from 'lucide-react';

function toFrontendRecord(data: any): AttendanceRecord {
  return {
    id: data.id || String(Date.now()),
    userId: data.user_id || '',
    date: data.date || '',
    checkIn: data.check_in || null,
    checkOut: data.check_out || null,
    status: data.status || 'PRESENT',
  };
}

export const Attendance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const [todayRes, historyRes] = await Promise.all([
        api.get('/attendance/today', { signal }),
        api.get('/attendance/history', { signal }),
      ]);
      const todayData = todayRes.data.data;
      setTodayRecord(todayData ? toFrontendRecord(todayData) : null);
      const records = (historyRes.data.data || []);
      const mapped = (records.data || records).map(toFrontendRecord);
      setHistory(mapped);
    } catch (err: any) {
      if (err?.name === 'CanceledError') return;
      setTodayRecord(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    refreshData(abortController.signal);
    return () => abortController.abort();
  }, [user]);

  const handleCheckIn = async () => {
    try {
      const res = await api.post('/attendance/check-in');
      setTodayRecord(toFrontendRecord(res.data.data));
      await refreshData();
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert('Already checked in today');
        await refreshData();
      } else {
        alert('Failed to check in');
      }
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      await api.put(`/attendance/${todayRecord.id}/check-out`);
      await refreshData();
    } catch {
      alert('Failed to check out');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('attendance')}</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
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
                            <td className="p-4"><span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">{rec.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
