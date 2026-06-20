import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { ActivityLog } from '../../types';

function toFrontendLog(data: any): ActivityLog {
  return {
    id: String(data.id),
    userId: data.user_id || '',
    action: data.action || '',
    timestamp: data.created_at || data.timestamp || '',
    details: data.details || '',
  };
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ['activity-logs'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/activity-logs', { signal });
      return (res.data.data || []).map(toFrontendLog);
    },
  });
}

export function useCreateActivityLog() {
  return useMutation({
    mutationFn: async (data: { user_id: string; action: string; details: string }) => {
      await api.post('/activity-logs', data);
    },
  });
}
