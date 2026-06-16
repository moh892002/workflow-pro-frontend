import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DB } from '../services/db';
import { User, Role, DEPARTMENTS, CredentialRequest, RequestType, RequestStatus } from '../types';
import { Plus, Trash2, Edit2, ShieldAlert, Key, Check, X, Camera, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function toBackendUser(data: Partial<User>, password?: string, departmentId?: number | null) {
  const body: Record<string, any> = {
    fullname: data.fullName,
    email: `${data.username}@example.com`,
    username: data.username,
    role: data.role || Role.EMPLOYEE,
    job_title: data.jobTitle,
    salary: data.salary || 0,
  };
  if (password) body.password = password;
  if (departmentId !== undefined) body.department_id = departmentId;
  return body;
}

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

export const EmployeeManagement = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<User[]>([]);
  const [requests, setRequests] = useState<CredentialRequest[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessRequestModalOpen, setIsProcessRequestModalOpen] = useState(false);
  const [isDeleteRequestModalOpen, setIsDeleteRequestModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CredentialRequest | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'requests'>('employees');
  const [loading, setLoading] = useState(true);

  const initialFormState: Partial<User> = {
    role: Role.EMPLOYEE,
    isActive: true,
    department: DEPARTMENTS[0],
    salary: 0,
  };
  const [formData, setFormData] = useState<Partial<User>>(initialFormState);
  const [password, setPassword] = useState('');
  const [processData, setProcessData] = useState({ newUsername: '', newPassword: '' });
  const [deleteReason, setDeleteReason] = useState('');

  const isAdmin = user?.role === Role.ADMIN;
  const isHR = user?.role === Role.HR_MANAGER;

  useEffect(() => {
    if (user && !isAdmin && !isHR) {
      navigate('/');
    }
  }, [user, isAdmin, isHR, navigate]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [usersRes, depsRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
      ]);
      const deptData = depsRes.data.data;
      const deptList = Array.isArray(deptData) ? deptData : (deptData?.data || []);
      setDepartments(deptList.map((d: any) => ({ id: d.id, name: d.name })));
      const userData = usersRes.data.data;
      const userList = Array.isArray(userData) ? userData : (userData?.data || []);
      const mapped = userList.map(toFrontendUser);
      setEmployees(mapped);
      setFilteredEmployees(mapped);
    } catch {
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = () => {
    if (!isAdmin) return;
    const all = DB.requests.getAll().filter(r => r.status === RequestStatus.PENDING);
    setRequests(all);
  };

  const refresh = () => {
    fetchEmployees();
    fetchRequests();
  };

  useEffect(() => { refresh() }, [user]);

  useEffect(() => {
    if (departmentFilter) {
      setFilteredEmployees(employees.filter(e => e.department === departmentFilter));
    } else {
      setFilteredEmployees(employees);
    }
  }, [departmentFilter, employees]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setFormData({ ...formData, profileImage: ev.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: User) => {
    setEditingId(emp.id);
    setFormData(emp);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (emp: User) => {
    if (!user) return;

    if (isAdmin) {
      if (!confirm("Are you sure you want to delete this employee?")) return;
      try {
        await api.delete(`/users/${emp.id}`);
        refresh();
      } catch {
        alert('Failed to delete employee');
      }
    } else if (isHR) {
      setEmployeeToDelete(emp);
      setDeleteReason('');
      setIsDeleteRequestModalOpen(true);
    }
  };

  const handleSubmitDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !employeeToDelete) return;

    DB.requests.add({
      id: Date.now().toString(),
      userId: user.id,
      userFullName: user.fullName,
      targetUserId: employeeToDelete.id,
      targetUserFullName: employeeToDelete.fullName,
      type: RequestType.DELETE_ACCOUNT,
      reason: deleteReason,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString(),
    });

    alert(t('delete_request_sent'));
    setIsDeleteRequestModalOpen(false);
    setEmployeeToDelete(null);
    refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) return;

    try {
      const deptId = departments.find(d => d.name === formData.department)?.id;

      if (editingId) {
        await api.put(`/users/${editingId}`, {
          fullname: formData.fullName,
          job_title: formData.jobTitle,
          role: formData.role,
          salary: formData.salary,
          username: formData.username,
          department_id: deptId,
        });
      } else {
        if (!formData.username || !password) {
          alert("Username and Password are required for new employees.");
          return;
        }
        const payload = toBackendUser(formData, password, deptId);
        const res = await api.post('/users', payload);
        const newUser = toFrontendUser(res.data.data || res.data);
        await api.put(`/users/${newUser.id}`, { image: newUser.profileImage });
      }
      setIsModalOpen(false);
      refresh();
    } catch {
      alert('Failed to save employee');
    }
  };

  const handleProcessRequest = (req: CredentialRequest, approved: boolean) => {
    if (!approved) {
      DB.requests.update({ ...req, status: RequestStatus.REJECTED, resolvedAt: new Date().toISOString() });
      refresh();
      return;
    }

    if (req.type === RequestType.DELETE_ACCOUNT) {
      if (req.targetUserId && user) {
        DB.users.delete(req.targetUserId, user);
        DB.requests.update({ ...req, status: RequestStatus.APPROVED, resolvedAt: new Date().toISOString() });
        refresh();
      }
    } else {
      setSelectedRequest(req);
      setProcessData({ newUsername: '', newPassword: '' });
      setIsProcessRequestModalOpen(true);
    }
  };

  const submitProcessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const targetId = selectedRequest.targetUserId || selectedRequest.userId;
    const targetUserObj = DB.users.getById(targetId);

    if (targetUserObj) {
      const updates: Partial<User> = {};
      if (selectedRequest.type === RequestType.USERNAME || selectedRequest.type === RequestType.BOTH) {
        if (processData.newUsername) updates.username = processData.newUsername;
      }
      if (selectedRequest.type === RequestType.PASSWORD || selectedRequest.type === RequestType.BOTH) {
        if (processData.newPassword) updates.password = processData.newPassword;
      }

      DB.users.update({ ...targetUserObj, ...updates });
      DB.requests.update({ ...selectedRequest, status: RequestStatus.APPROVED, resolvedAt: new Date().toISOString() });

      setIsProcessRequestModalOpen(false);
      refresh();
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('employees')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage access, roles, and profiles.</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex text-sm font-medium">
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`px-3 py-1.5 rounded-md transition ${activeTab === 'employees' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                  All Employees
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                  Requests
                  {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{requests.length}</span>}
                </button>
              </div>
              <button onClick={handleOpenAdd} className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-900/20 transition">
                <Plus size={20} /> {t('add_employee')}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : activeTab === 'employees' && (
        <>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-4 overflow-x-auto">
            <select
              className="border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white min-w-[200px]"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">{t('department_filter')}</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${emp.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>

                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <img
                      src={emp.profileImage}
                      className="w-16 h-16 rounded-full object-cover border-4 border-slate-50 dark:border-slate-700 transition-transform duration-300 group-hover:scale-105"
                      alt={emp.fullName}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(emp)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                      <Edit2 size={16} />
                    </button>
                    {emp.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteClick(emp)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600"
                        title={isHR ? t('request_delete') : t('delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{emp.fullName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{emp.jobTitle}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 uppercase font-bold tracking-wider">{t('role')}</span>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">{emp.role}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 uppercase font-bold tracking-wider">{t('department')}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[150px]" title={emp.department}>{emp.department}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isAdmin && activeTab === 'requests' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <Check className="w-12 h-12 mb-4 text-green-500 bg-green-50 rounded-full p-2" />
              <p>{t('no_requests')}</p>
            </div>
          ) : (
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-4">{t('requester')}</th>
                  <th className="p-4">{t('request_type')}</th>
                  <th className="p-4">Target / Details</th>
                  <th className="p-4">{t('date')}</th>
                  <th className="p-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {requests.map(req => (
                  <tr key={req.id}>
                    <td className="p-4 font-medium text-slate-800 dark:text-white">
                      {req.userFullName} <br />
                      <span className="text-xs text-slate-400">ID: {req.userId}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        req.type === RequestType.DELETE_ACCOUNT
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {req.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs">
                      {req.type === RequestType.DELETE_ACCOUNT && req.targetUserFullName ? (
                        <div>
                          <span className="font-bold text-red-500">Delete: {req.targetUserFullName}</span>
                          <p className="text-xs italic mt-1">"{req.reason}"</p>
                        </div>
                      ) : (
                        <span className="italic">"{req.reason}"</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleProcessRequest(req, true)} className="p-2 text-green-600 hover:bg-green-50 rounded transition flex items-center gap-1 text-xs font-bold border border-green-200">
                        <Check size={14} /> {t('approve')}
                      </button>
                      <button onClick={() => handleProcessRequest(req, false)} className="p-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-1 text-xs font-bold border border-red-200">
                        <X size={14} /> {t('reject')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">
              {editingId ? t('edit_employee') : t('add_employee')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <img src={formData.profileImage || "https://via.placeholder.com/100"} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 dark:border-slate-700 shadow-md" />
                    {!editingId && (
                      <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition text-white">
                        <Camera size={24} />
                        <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                  {editingId && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-xs text-yellow-700 dark:text-yellow-400 flex items-start gap-2 max-w-[200px]">
                      <ShieldAlert size={16} className="shrink-0" />
                      <span>Profile pictures must be updated by the employee themselves.</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t('full_name')}</label>
                      <input required className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
                      <input required className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" value={formData.jobTitle || ''} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t('department')}</label>
                      <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t('role')}</label>
                      <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })}>
                        {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  {!editingId && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                      <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2"><Key size={16} /> User Credentials</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-blue-600/70 mb-1">{t('username')}</label>
                          <input required className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-blue-600/70 mb-1">{t('password')}</label>
                          <input required type="text" className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('salary')} ($)</label>
                    <input type="number" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" value={formData.salary} onChange={e => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition font-medium">{t('cancel')}</button>
                <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg transition font-medium shadow-lg shadow-blue-900/20">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteRequestModalOpen && employeeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-red-200 dark:border-red-900/50 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 mb-4 border-b border-red-100 dark:border-red-900/30 pb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">{t('request_delete')}</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              You are requesting to delete employee: <span className="font-bold text-slate-800 dark:text-white">{employeeToDelete.fullName}</span>.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4 text-xs text-blue-700 dark:text-blue-300">
              {t('delete_request_desc')}
            </div>

            <form onSubmit={handleSubmitDeleteRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('reason')}</label>
                <textarea required className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" rows={3} value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Reason for deletion..." />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeleteRequestModalOpen(false)} className="px-4 py-2 text-slate-600">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">Request Deletion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProcessRequestModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">Approve Change</h3>
            <p className="text-sm text-slate-500 mb-6">For: <span className="font-bold text-slate-800 dark:text-white">{selectedRequest.userFullName}</span></p>

            <form onSubmit={submitProcessRequest} className="space-y-4">
              {(selectedRequest.type === RequestType.USERNAME || selectedRequest.type === RequestType.BOTH) && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('new_username')}</label>
                  <input required className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={processData.newUsername} onChange={e => setProcessData({ ...processData, newUsername: e.target.value })} />
                </div>
              )}
              {(selectedRequest.type === RequestType.PASSWORD || selectedRequest.type === RequestType.BOTH) && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('new_password')}</label>
                  <input required type="text" className="w-full border dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={processData.newPassword} onChange={e => setProcessData({ ...processData, newPassword: e.target.value })} />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsProcessRequestModalOpen(false)} className="px-4 py-2 text-slate-600">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">{t('approve')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
