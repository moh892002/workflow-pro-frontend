import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { AttendanceRecord } from '../../types';

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

export function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/attendance/today', { signal });
      return res.data.data ? toFrontendRecord(res.data.data) : null;
    },
  });
}

export function useAttendanceHistory() {
  return useQuery({
    queryKey: ['attendance', 'history'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/attendance/history', { signal });
      const records = res.data.data || [];
      const mapped = (records.data || records).map(toFrontendRecord);
      return mapped;
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/check-in');
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      await api.put(`/attendance/${recordId}/check-out`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
