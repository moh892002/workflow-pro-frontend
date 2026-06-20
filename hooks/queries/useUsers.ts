import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { User, Role } from '../../types';

function toFrontendUser(data: any): User {
  return {
    id: String(data.id),
    fullName: data.fullname || '',
    username: data.username || '',
    role: data.role || Role.EMPLOYEE,
    department: data.department?.name || '',
    salary: data.salary,
    isActive: data.deleted_at === null,
    profileImage: data.image_url || `https://ui-avatars.com/api/?name=${data.fullname}&background=random`,
    jobTitle: data.job_title || '',
    isBot: false,
  };
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/users', { signal });
      const data = res.data.data;
      const list = Array.isArray(data) ? data : (data?.data || []);
      return list.map(toFrontendUser);
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/departments', { signal });
      const data = res.data.data;
      const list = Array.isArray(data) ? data : (data?.data || []);
      return list.map((d: any) => ({ id: d.id, name: d.name }));
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await api.post('/users', payload);
      const newUser = toFrontendUser(res.data.data || res.data);
      if (newUser.profileImage) {
        await api.put(`/users/${newUser.id}`, { image: newUser.profileImage });
      }
      return newUser;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      await api.put(`/users/${id}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
