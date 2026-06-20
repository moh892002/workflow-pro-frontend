import { Role, TaskPriority, TaskStatus, User, Task } from "../../types";

export const mockAdmin: User = {
  id: "1",
  fullName: "Abdalraheem Fadda",
  username: "admin",
  role: Role.ADMIN,
  department: "Executive Management",
  salary: 5000,
  isActive: true,
  jobTitle: "Super Admin",
  profileImage:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  isBot: false,
};

export const mockEmployee: User = {
  id: "2",
  fullName: "Jane Employee",
  username: "jane",
  role: Role.EMPLOYEE,
  department: "Engineering",
  salary: 3000,
  isActive: true,
  jobTitle: "Developer",
  profileImage: "",
  isBot: false,
};

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Q1 Sales Report",
    description: "Compile the sales data for Q1 2024.",
    assignedToId: "1",
    assignedToName: "Abdalraheem Fadda",
    priority: TaskPriority.HIGH,
    status: TaskStatus.PENDING,
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    progress: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t2",
    title: "Recruitment Plan",
    description: "Prepare recruitment plan for Q2.",
    assignedToId: "2",
    assignedToName: "Jane Employee",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.IN_PROGRESS,
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    progress: 50,
    createdAt: new Date().toISOString(),
  },
];

export const mockUsers: User[] = [mockAdmin, mockEmployee];

export const mockAttendance = [
  {
    id: "a1",
    user_id: "1",
    date: new Date().toISOString().split("T")[0],
    check_in: new Date().toISOString(),
    check_out: null,
    status: "PRESENT",
  },
];

export const mockActivityLogs = [
  {
    id: "l1",
    user_id: "1",
    action: "CREATE_TASK",
    details: "Created task: Test task",
    created_at: new Date().toISOString(),
  },
];
