import { useQueries } from '@tanstack/react-query';
import api from '../../services/api';
import { Task, TaskStatus, Role, ActivityLog, AttendanceRecord } from '../../types';

function toFrontendTask(data: any): Task {
  const statusMap: Record<string, any> = { pending: 'PENDING', in_progress: 'IN_PROGRESS', completed: 'COMPLETED' };
  const priorityMap: Record<string, any> = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'CRITICAL' };
  const status = statusMap[data.status] || 'PENDING';
  const deadline = data.deadline_date || '';
  let computedStatus = status;
  if (status !== 'COMPLETED' && deadline && new Date(deadline) < new Date(new Date().toDateString())) {
    computedStatus = 'OVERDUE';
  }
  return {
    id: String(data.id),
    title: data.title || '',
    description: data.description || '',
    assignedToId: data.assigned_to ? String(data.assigned_to) : '',
    assignedToName: data.user?.fullname || 'Unknown',
    priority: priorityMap[data.priority] || 'MEDIUM',
    status: computedStatus,
    deadline,
    progress: computedStatus === 'COMPLETED' ? 100 : computedStatus === 'IN_PROGRESS' ? 50 : 0,
    createdAt: data.created_at || '',
  };
}

function toFrontendLog(data: any): ActivityLog {
  return {
    id: String(data.id),
    userId: data.user_id || '',
    action: data.action || '',
    timestamp: data.created_at || data.timestamp || '',
    details: data.details || '',
  };
}

function toFrontendAttendance(data: any): AttendanceRecord {
  return {
    id: data.id || String(Date.now()),
    userId: data.user_id || '',
    date: data.date || '',
    checkIn: data.check_in || null,
    checkOut: data.check_out || null,
    status: data.status || 'PRESENT',
  };
}

interface DashboardStats {
  employees: number;
  active: number;
  completed: number;
  overdue: number;
  present: number;
  absent: number;
  late: number;
}

export function useDashboardData(user: any) {
  const todayStr = new Date().toISOString().split('T')[0];

  const results = useQueries({
    queries: [
      {
        queryKey: ['tasks'],
        queryFn: async ({ signal }: any) => {
          const res = await api.get('/tasks', { signal });
          return (res.data.data || []).map(toFrontendTask);
        },
      },
      {
        queryKey: ['users'],
        queryFn: async ({ signal }: any) => {
          const res = await api.get('/users', { signal });
          return (res.data.data || []).filter((u: any) => !u.isBot).map((u: any) => ({
            id: String(u.id),
            isActive: u.deleted_at === null,
            role: u.role,
          }));
        },
      },
      {
        queryKey: ['activity-logs'],
        queryFn: async ({ signal }: any) => {
          const res = await api.get('/activity-logs', { signal });
          return (res.data.data || []).map(toFrontendLog);
        },
      },
      {
        queryKey: ['attendance', 'today-date', todayStr],
        queryFn: async ({ signal }: any) => {
          const res = await api.get(`/attendance?date=${todayStr}`, { signal });
          return (res.data.data || []).map(toFrontendAttendance);
        },
      },
    ],
  });

  const [tasksQuery, usersQuery, logsQuery, attendanceQuery] = results;

  const allTasks = tasksQuery.data || [];
  const allUsers = usersQuery.data || [];
  const allLogs = logsQuery.data || [];
  const todayRecords = attendanceQuery.data || [];

  const isAdmin = user?.role === Role.ADMIN;
  const activeEmployees = allUsers.filter((u: any) => u.isActive);
  const presentCount = todayRecords.length;
  const lateCount = todayRecords.filter((r: any) => {
    if (!r.checkIn) return false;
    const d = new Date(r.checkIn);
    return d.getHours() > 9 || (d.getHours() === 9 && d.getMinutes() > 0);
  }).length;
  const absentCount = Math.max(0, activeEmployees.length - presentCount);

  let stats: DashboardStats;
  let logs: ActivityLog[];
  let employeeTasks: Task[];

  if (isAdmin) {
    stats = {
      employees: activeEmployees.length,
      active: allTasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PENDING).length,
      completed: allTasks.filter((t: Task) => t.status === TaskStatus.COMPLETED).length,
      overdue: allTasks.filter((t: Task) => t.status === TaskStatus.OVERDUE).length,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
    };
    logs = allLogs.slice(0, 5);
    employeeTasks = [];
  } else {
    const myTasks = allTasks.filter((t: Task) => t.assignedToId === user?.id);
    stats = {
      employees: 0,
      active: myTasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PENDING).length,
      completed: myTasks.filter((t: Task) => t.status === TaskStatus.COMPLETED).length,
      overdue: myTasks.filter((t: Task) => t.status === TaskStatus.OVERDUE).length,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
    };
    logs = allLogs.filter((l: ActivityLog) => l.userId === user?.id).slice(0, 5);
    employeeTasks = myTasks;
  }

  return {
    stats,
    logs,
    employeeTasks,
    isLoading: results.some((r) => r.isLoading),
  };
}
