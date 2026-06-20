import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { RecycleBinItem } from '../../types';

const MODEL_TYPE_MAP: Record<string, string> = {
  'App\\Models\\User': 'USER',
  'App\\Models\\Task': 'TASK',
  'App\\Models\\SalaryRecord': 'FINANCE',
  'App\\Models\\Department': 'DEPARTMENT',
  'App\\Models\\AttendanceRecord': 'ATTENDANCE',
  'App\\Models\\PerformanceReview': 'REVIEW',
};

function toFrontendItem(data: any): RecycleBinItem {
  const model = data.deleted_model || '';
  const type = MODEL_TYPE_MAP[model] || 'REPORT';
  const originalData = data.deleted_data || {};

  let label = 'Unknown Item';
  if (type === 'USER') label = originalData.fullname || originalData.name || '';
  else if (type === 'TASK') label = originalData.title || '';
  else if (type === 'FINANCE') label = `${originalData.transaction_type || 'Transaction'} - $${originalData.amount || 0}`;
  else if (type === 'DEPARTMENT') label = originalData.name || '';
  else if (type === 'ATTENDANCE') label = `${originalData.action || 'Check'} - ${originalData.date || ''}`;
  else if (type === 'REVIEW') label = originalData.title || `Review #${data.deleted_item_id || ''}`;

  return {
    id: String(data.id),
    originalId: String(data.deleted_item_id),
    type: type as RecycleBinItem['type'],
    data: { ...originalData, _label: label, _model: model },
    deletedBy: data.user?.fullname || data.deleted_by || 'Unknown',
    deletedById: String(data.deleted_by || ''),
    deletedAt: data.deleted_at || data.created_at || '',
  };
}

function getModelName(item: RecycleBinItem): string {
  const model = item.data?._model || '';
  const parts = model.split('\\');
  return parts[parts.length - 1] || 'User';
}

export function useRecycleBin() {
  return useQuery({
    queryKey: ['recycle-bin'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/recycle-bin', { signal });
      const data = res.data.data;
      const arr: any[] = Array.isArray(data) ? data : (data?.data || []);
      return arr.map(toFrontendItem);
    },
  });
}

export function useRestoreItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: RecycleBinItem) => {
      const modelName = getModelName(item);
      await api.post(`/recycle-bin/${modelName}/${item.originalId}/restore`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recycle-bin'] }),
  });
}

export function useForceDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: RecycleBinItem) => {
      const modelName = getModelName(item);
      await api.delete(`/recycle-bin/${modelName}/${item.originalId}/force`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recycle-bin'] }),
  });
}
