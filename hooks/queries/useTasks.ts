import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Task, TaskPriority, TaskStatus } from '../../types';

const PRIORITY_MAP: Record<string, TaskPriority> = {
  LOW: TaskPriority.LOW,
  MEDIUM: TaskPriority.MEDIUM,
  HIGH: TaskPriority.HIGH,
  URGENT: TaskPriority.CRITICAL,
};
const PRIORITY_REVERSE: Record<string, string> = {
  [TaskPriority.LOW]: 'LOW',
  [TaskPriority.MEDIUM]: 'MEDIUM',
  [TaskPriority.HIGH]: 'HIGH',
  [TaskPriority.CRITICAL]: 'URGENT',
};
const STATUS_MAP: Record<string, TaskStatus> = {
  pending: TaskStatus.PENDING,
  in_progress: TaskStatus.IN_PROGRESS,
  completed: TaskStatus.COMPLETED,
};
const STATUS_REVERSE: Record<string, string> = {
  [TaskStatus.PENDING]: 'pending',
  [TaskStatus.IN_PROGRESS]: 'in_progress',
  [TaskStatus.COMPLETED]: 'completed',
  [TaskStatus.OVERDUE]: 'pending',
};

function toFrontendTask(data: any): Task {
  const status = STATUS_MAP[data.status] || TaskStatus.PENDING;
  const deadline = data.deadline_date || '';
  let computedStatus = status;
  if (status !== TaskStatus.COMPLETED && deadline && new Date(deadline) < new Date(new Date().toDateString())) {
    computedStatus = TaskStatus.OVERDUE;
  }
  return {
    id: String(data.id),
    title: data.title || '',
    description: data.description || '',
    assignedToId: data.assigned_to ? String(data.assigned_to) : '',
    assignedToName: data.user?.fullname || 'Unknown',
    priority: PRIORITY_MAP[data.priority] || TaskPriority.MEDIUM,
    status: computedStatus,
    deadline,
    progress: computedStatus === TaskStatus.COMPLETED ? 100 : computedStatus === TaskStatus.IN_PROGRESS ? 50 : 0,
    createdAt: data.created_at || '',
  };
}

function toBackendTask(task: Partial<Task>) {
  return {
    title: task.title,
    description: task.description || '',
    priority: PRIORITY_REVERSE[task.priority || TaskPriority.MEDIUM],
    status: STATUS_REVERSE[task.status || TaskStatus.PENDING],
    deadline_date: task.deadline,
    assigned_to: task.assignedToId || null,
  };
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/tasks', { signal });
      return (res.data.data || []).map(toFrontendTask);
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const body = toBackendTask(task);
      await api.post('/tasks', body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, task }: { taskId: string; task: Partial<Task> }) => {
      const backendStatus = STATUS_REVERSE[task.status || TaskStatus.PENDING];
      await api.put(`/tasks/${taskId}`, {
        ...toBackendTask(task),
        status: backendStatus,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
