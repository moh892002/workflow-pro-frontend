import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { FinancialRecord, TransactionType, User } from '../../types';

const TX_TYPE_MAP: Record<string, TransactionType> = {
  salary: TransactionType.SALARY,
  bonus: TransactionType.BONUS,
  deduction: TransactionType.DEDUCTION,
  advance: TransactionType.ADVANCE,
  overtime: TransactionType.OVERTIME,
};
const TX_TYPE_REVERSE: Record<string, string> = {
  [TransactionType.SALARY]: 'salary',
  [TransactionType.BONUS]: 'bonus',
  [TransactionType.DEDUCTION]: 'deduction',
  [TransactionType.ADVANCE]: 'advance',
  [TransactionType.OVERTIME]: 'overtime',
};

function toFrontendUser(data: any): User {
  return {
    id: String(data.id),
    fullName: data.fullname || '',
    username: data.username || '',
    role: data.role || 'EMPLOYEE' as any,
    department: data.department?.name || '',
    salary: data.salary,
    isActive: data.deleted_at === null,
    profileImage: data.image_url || `https://ui-avatars.com/api/?name=${data.fullname}&background=random`,
    jobTitle: data.job_title || '',
    isBot: false,
  };
}

function toFrontendRecord(data: any, users: Map<string, string>): FinancialRecord {
  const userId = String(data.user_id || '');
  return {
    id: String(data.id),
    employeeId: userId,
    employeeName: users.get(userId) || data.user?.fullname || data.user?.name || 'Unknown',
    department: data.user?.department?.name || '',
    type: TX_TYPE_MAP[data.transaction_type] || TransactionType.SALARY,
    amount: Number(data.amount) || 0,
    date: data.transaction_date || '',
    notes: data.notes || '',
    createdBy: '',
    createdAt: data.created_at || '',
  };
}

export function useFinanceRecords() {
  return useQuery({
    queryKey: ['records'],
    queryFn: async ({ signal }) => {
      const [recordsRes, usersRes] = await Promise.all([
        api.get('/records', { signal }),
        api.get('/users', { signal }),
      ]);

      const usersData = usersRes.data.data || [];
      const userMap = new Map<string, string>();
      const mappedUsers = usersData.map((u: any) => {
        const fu = toFrontendUser(u);
        userMap.set(fu.id, fu.fullName);
        return fu;
      });

      const recordsData = recordsRes.data.data;
      const recordsArray: any[] = recordsData.data || recordsData || [];
      const records = recordsArray.map((r: any) => toFrontendRecord(r, userMap));

      return { records, employees: mappedUsers, userMap };
    },
  });
}

export function useCreateFinanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      transaction_type: string;
      amount: number;
      transaction_date: string;
      notes: string;
    }) => {
      await api.post('/records', data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  });
}

export function useDeleteFinanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/records/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  });
}
