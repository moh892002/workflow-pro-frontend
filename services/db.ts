import {
  User,
  Task,
  AttendanceRecord,
  ActivityLog,
  Role,
  TaskPriority,
  TaskStatus,
  Message,
  CredentialRequest,
  FinancialRecord,
  RecycleBinItem,
  DEPARTMENTS,
} from "../types";

const STORAGE_KEYS = {
  USERS: "wfp_users",
  TASKS: "wfp_tasks",
  ATTENDANCE: "wfp_attendance",
  LOGS: "wfp_logs",
  MESSAGES: "wfp_messages",
  REQUESTS: "wfp_credential_requests",
  FINANCE: "wfp_finance",
  RECYCLE_BIN: "wfp_recycle_bin",
  CURRENT_USER: "wfp_current_user",
};

// Seed Data for Fresh Install
const INITIAL_USERS: User[] = [
  {
    id: "1",
    fullName: "Abdalraheem Fadda",
    username: "admin",
    role: Role.ADMIN,
    department: "Executive Management",
    salary: 5000,
    isActive: true,
    jobTitle: "Super Admin",
    // Using a realistic professional placeholder since browsers cannot read C:\ paths directly
    profileImage:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    themePreference: "light",
  },
  {
    id: "2",
    fullName: "Osama  Al-Zero",
    username: "osama",
    role: Role.HR_MANAGER,
    department: "Human Resources (HR)",
    salary: 3500,
    isActive: true,
    jobTitle: "HR Manager",
    profileImage:
      "https://ui-avatars.com/api/?name=Osama+Hamdan&background=0D8ABC&color=fff",
    themePreference: "light",
  },
  {
    id: "3",
    fullName: "Khalil Ali",
    username: "khalil",
    role: Role.OPS_MANAGER,
    department: "Operations (OPS)",
    salary: 3200,
    isActive: true,
    jobTitle: "Operations Manager",
    profileImage:
      "https://ui-avatars.com/api/?name=Khalil+Al-Hayya&background=random",
    themePreference: "light",
  },
  {
    id: "4",
    fullName: "Donald Trump",
    username: "donald",
    role: Role.SALES_DIRECTOR,
    department: "Sales",
    salary: 4000,
    isActive: true,
    jobTitle: "Sales Director",
    profileImage:
      "https://ui-avatars.com/api/?name=Donald+Trump&background=random",
    themePreference: "light",
  },
  {
    id: "gpt_ai",
    fullName: "GPT AI",
    username: "gpt_ai",
    role: Role.ADMIN,
    department: "Artificial Intelligence",
    isActive: true,
    jobTitle: "Virtual Assistant",
    profileImage:
      "https://ui-avatars.com/api/?name=GPT+AI&background=10b981&color=fff",
    themePreference: "light",
    isBot: true,
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "Q1 Sales Report",
    description: "Compile the sales data for Q1 2024.",
    assignedToId: "4",
    assignedById: "1",
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    progress: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t2",
    title: "Recruitment Plan",
    description: "Prepare recruitment plan for Q2.",
    assignedToId: "2",
    assignedById: "1",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    progress: 0,
    createdAt: new Date().toISOString(),
  },
];

// DATA MIGRATION HELPER
const migrateData = () => {
  try {
    const usersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (usersRaw) {
      const users: User[] = JSON.parse(usersRaw);
      const updatedUsers = users.map((u) => ({
        ...u,
        department: u.department || DEPARTMENTS[0],
        salary: u.salary || 0,
        jobTitle: u.jobTitle || u.role,
        themePreference: u.themePreference || "light",
      }));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    }
  } catch (e) {
    console.error("Migration Error", e);
  }
};

export const initDB = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS))
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  if (!localStorage.getItem(STORAGE_KEYS.TASKS))
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  if (!localStorage.getItem(STORAGE_KEYS.LOGS))
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE))
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES))
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.REQUESTS))
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.FINANCE))
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.RECYCLE_BIN))
    localStorage.setItem(STORAGE_KEYS.RECYCLE_BIN, JSON.stringify([]));

  migrateData();
};

const get = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const save = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event("storage"));
};

// Helper: Move to Bin
const moveToBin = (
  type: "USER" | "TASK" | "FINANCE" | "REPORT",
  data: any,
  deletedBy: User
) => {
  const bin = get<RecycleBinItem>(STORAGE_KEYS.RECYCLE_BIN);
  bin.push({
    id: Date.now().toString(),
    originalId: data.id,
    type,
    data,
    deletedBy: deletedBy.fullName,
    deletedById: deletedBy.id,
    deletedAt: new Date().toISOString(),
  });
  save(STORAGE_KEYS.RECYCLE_BIN, bin);

  const logs = get<ActivityLog>(STORAGE_KEYS.LOGS);
  logs.unshift({
    id: Date.now().toString(),
    userId: deletedBy.id,
    action: `DELETE_${type}`,
    timestamp: new Date().toISOString(),
    details: `${deletedBy.username} moved ${type} (ID: ${data.id}) to Recycle Bin`,
  });
  save(STORAGE_KEYS.LOGS, logs);
};

export const DB = {
  users: {
    getAll: () => get<User>(STORAGE_KEYS.USERS),
    getById: (id: string) =>
      get<User>(STORAGE_KEYS.USERS).find((u) => u.id === id),
    add: (user: User) => {
      const users = get<User>(STORAGE_KEYS.USERS);
      users.push(user);
      save(STORAGE_KEYS.USERS, users);
    },
    update: (user: User) => {
      let users = get<User>(STORAGE_KEYS.USERS);
      users = users.map((u) => (u.id === user.id ? user : u));
      save(STORAGE_KEYS.USERS, users);

      // Update session if it matches
      const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (currentUser) {
        const parsed = JSON.parse(currentUser);
        if (parsed.id === user.id) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
      }
    },
    delete: (id: string, adminUser: User) => {
      let users = get<User>(STORAGE_KEYS.USERS);
      const target = users.find((u) => u.id === id);
      if (target) {
        moveToBin("USER", target, adminUser);
        users = users.filter((u) => u.id !== id);
        save(STORAGE_KEYS.USERS, users);
      }
    },
  },
  tasks: {
    getAll: () => get<Task>(STORAGE_KEYS.TASKS),
    add: (task: Task) => {
      const tasks = get<Task>(STORAGE_KEYS.TASKS);
      tasks.push(task);
      save(STORAGE_KEYS.TASKS, tasks);
    },
    update: (task: Task) => {
      let tasks = get<Task>(STORAGE_KEYS.TASKS);
      tasks = tasks.map((t) => (t.id === task.id ? task : t));
      save(STORAGE_KEYS.TASKS, tasks);
    },
    delete: (id: string, user: User) => {
      let tasks = get<Task>(STORAGE_KEYS.TASKS);
      const target = tasks.find((t) => t.id === id);
      if (target) {
        moveToBin("TASK", target, user);
        tasks = tasks.filter((t) => t.id !== id);
        save(STORAGE_KEYS.TASKS, tasks);
      }
    },
  },
  finance: {
    getAll: () => get<FinancialRecord>(STORAGE_KEYS.FINANCE),
    add: (record: FinancialRecord) => {
      const recs = get<FinancialRecord>(STORAGE_KEYS.FINANCE);
      recs.push(record);
      save(STORAGE_KEYS.FINANCE, recs);
    },
    update: (record: FinancialRecord) => {
      let recs = get<FinancialRecord>(STORAGE_KEYS.FINANCE);
      recs = recs.map((r) => (r.id === record.id ? record : r));
      save(STORAGE_KEYS.FINANCE, recs);
    },
    delete: (id: string, user: User) => {
      let recs = get<FinancialRecord>(STORAGE_KEYS.FINANCE);
      const target = recs.find((r) => r.id === id);
      if (target) {
        moveToBin("FINANCE", target, user);
        recs = recs.filter((r) => r.id !== id);
        save(STORAGE_KEYS.FINANCE, recs);
      }
    },
  },
  recycleBin: {
    getAll: () => get<RecycleBinItem>(STORAGE_KEYS.RECYCLE_BIN),
    restore: (itemId: string) => {
      let bin = get<RecycleBinItem>(STORAGE_KEYS.RECYCLE_BIN);
      const item = bin.find((i) => i.id === itemId);
      if (item) {
        if (item.type === "USER") {
          const users = get<User>(STORAGE_KEYS.USERS);
          users.push(item.data);
          save(STORAGE_KEYS.USERS, users);
        } else if (item.type === "TASK") {
          const tasks = get<Task>(STORAGE_KEYS.TASKS);
          tasks.push(item.data);
          save(STORAGE_KEYS.TASKS, tasks);
        } else if (item.type === "FINANCE") {
          const fin = get<FinancialRecord>(STORAGE_KEYS.FINANCE);
          fin.push(item.data);
          save(STORAGE_KEYS.FINANCE, fin);
        }
        bin = bin.filter((i) => i.id !== itemId);
        save(STORAGE_KEYS.RECYCLE_BIN, bin);
      }
    },
    hardDelete: (itemId: string, user: User) => {
      let bin = get<RecycleBinItem>(STORAGE_KEYS.RECYCLE_BIN);
      const item = bin.find((i) => i.id === itemId);
      if (item) {
        bin = bin.filter((i) => i.id !== itemId);
        save(STORAGE_KEYS.RECYCLE_BIN, bin);

        const logs = get<ActivityLog>(STORAGE_KEYS.LOGS);
        logs.unshift({
          id: Date.now().toString(),
          userId: user.id,
          action: `PERMANENT_DELETE`,
          timestamp: new Date().toISOString(),
          details: `${user.username} permanently deleted ${item.type} (ID: ${item.originalId})`,
        });
        save(STORAGE_KEYS.LOGS, logs);
      }
    },
  },
  requests: {
    getAll: () => get<CredentialRequest>(STORAGE_KEYS.REQUESTS),
    add: (req: CredentialRequest) => {
      const reqs = get<CredentialRequest>(STORAGE_KEYS.REQUESTS);
      reqs.push(req);
      save(STORAGE_KEYS.REQUESTS, reqs);
    },
    update: (req: CredentialRequest) => {
      let reqs = get<CredentialRequest>(STORAGE_KEYS.REQUESTS);
      reqs = reqs.map((r) => (r.id === req.id ? req : r));
      save(STORAGE_KEYS.REQUESTS, reqs);
    },
  },
  attendance: {
    getAll: () => get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE),
    add: (record: AttendanceRecord) => {
      const records = get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      records.push(record);
      save(STORAGE_KEYS.ATTENDANCE, records);
    },
    update: (record: AttendanceRecord) => {
      let records = get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      records = records.map((r) => (r.id === record.id ? record : r));
      save(STORAGE_KEYS.ATTENDANCE, records);
    },
    autoCheckIn: (userId: string) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const records = get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      const existing = records.find(
        (r) => r.userId === userId && r.date === todayStr
      );
      if (!existing) {
        const now = new Date();
        const isLate =
          now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
        const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          userId,
          date: todayStr,
          checkIn: new Date().toISOString(),
          checkOut: null,
          status: isLate ? "LATE" : "PRESENT",
        };
        records.push(newRecord);
        save(STORAGE_KEYS.ATTENDANCE, records);
      }
    },
    autoCheckOut: (userId: string) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const records = get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      const existing = records.find(
        (r) => r.userId === userId && r.date === todayStr
      );
      if (existing) {
        const updated = { ...existing, checkOut: new Date().toISOString() };
        const newRecords = records.map((r) =>
          r.id === updated.id ? updated : r
        );
        save(STORAGE_KEYS.ATTENDANCE, newRecords);
      }
    },
  },
  logs: {
    getAll: () => get<ActivityLog>(STORAGE_KEYS.LOGS),
    add: (log: ActivityLog) => {
      const logs = get<ActivityLog>(STORAGE_KEYS.LOGS);
      logs.unshift(log);
      if (logs.length > 500) logs.pop();
      save(STORAGE_KEYS.LOGS, logs);
    },
  },
  messages: {
    getAll: () => get<Message>(STORAGE_KEYS.MESSAGES),
    getConversation: (user1Id: string, user2Id: string) => {
      const msgs = get<Message>(STORAGE_KEYS.MESSAGES);
      return msgs
        .filter(
          (m) =>
            (m.senderId === user1Id && m.receiverId === user2Id) ||
            (m.senderId === user2Id && m.receiverId === user1Id)
        )
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    },
    send: (message: Message) => {
      const msgs = get<Message>(STORAGE_KEYS.MESSAGES);
      msgs.push(message);
      save(STORAGE_KEYS.MESSAGES, msgs);
    },
    markRead: (senderId: string, receiverId: string) => {
      const msgs = get<Message>(STORAGE_KEYS.MESSAGES);
      const updated = msgs.map((m) => {
        if (
          m.senderId === senderId &&
          m.receiverId === receiverId &&
          !m.isRead
        ) {
          return { ...m, isRead: true };
        }
        return m;
      });
      save(STORAGE_KEYS.MESSAGES, updated);
    },
    getUnreadCount: (userId: string) => {
      const msgs = get<Message>(STORAGE_KEYS.MESSAGES);
      return msgs.filter((m) => m.receiverId === userId && !m.isRead).length;
    },
    getUnreadCountFromSender: (userId: string, senderId: string) => {
      const msgs = get<Message>(STORAGE_KEYS.MESSAGES);
      return msgs.filter(
        (m) => m.receiverId === userId && m.senderId === senderId && !m.isRead
      ).length;
    },
  },
};

initDB();
