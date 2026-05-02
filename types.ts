
export enum Role {
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  OPS_MANAGER = 'OPS_MANAGER',
  SALES_DIRECTOR = 'SALES_DIRECTOR',
  EMPLOYEE = 'EMPLOYEE'
}

export const DEPARTMENTS = [
  "Human Resources (HR)", "Operations (OPS)", "Sales", "Marketing", "Finance", "Accounting",
  "Customer Support / Customer Service", "Information Technology (IT)", "Software Development",
  "Web Development", "Mobile App Development", "Cyber Security", "Network & System Administration",
  "Data Analysis", "Data Science", "Artificial Intelligence", "Project Management", "Product Management",
  "Quality Assurance (QA)", "Testing", "UI/UX Design", "Graphic Design", "Motion Graphics",
  "Video Editing", "Content Creation", "Social Media Management", "Digital Marketing", "SEO / SEM",
  "Business Development", "Procurement", "Supply Chain", "Logistics", "Warehouse Management",
  "Public Relations (PR)", "Legal Affairs", "Compliance", "Risk Management", "Internal Audit",
  "Research & Development (R&D)", "Engineering", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Architecture", "Technical Support", "Call Center", "Training & Development",
  "Learning & Development (L&D)", "Administration", "Office Management", "Executive Management"
];

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  password?: string; 
  role: Role;
  department?: string; 
  salary?: number;     
  isActive: boolean;
  profileImage?: string;
  jobTitle: string;
  themePreference?: 'light' | 'dark';
  isBot?: boolean;
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum RequestType {
  USERNAME = 'USERNAME',
  PASSWORD = 'PASSWORD',
  BOTH = 'BOTH',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT'
}

export interface CredentialRequest {
  id: string;
  userId: string;
  userFullName: string;
  targetUserId?: string;
  targetUserFullName?: string;
  type: RequestType;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedById: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string; 
  progress: number; 
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; 
  checkIn: string | null; 
  checkOut: string | null; 
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface Attachment {
  type: 'image' | 'file';
  name: string;
  data: string; 
  size?: number; 
  mimeType?: string; 
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment?: Attachment;
  timestamp: string;
  isRead: boolean;
}

export interface PerformanceReport {
  score: number; 
  summary: string;
  suggestions: string[];
  level: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical';
}

export interface LanguageContextType {
  lang: 'en' | 'ar';
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

// --- NEW FINANCIAL TYPES ---
export enum TransactionType {
  SALARY = 'SALARY',
  BONUS = 'BONUS',
  DEDUCTION = 'DEDUCTION',
  ADVANCE = 'ADVANCE',
  OVERTIME = 'OVERTIME'
}

export interface FinancialRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: TransactionType;
  amount: number;
  date: string;
  notes: string;
  createdBy: string; // User ID
  createdAt: string;
}

// --- NEW RECYCLE BIN TYPES ---
export interface RecycleBinItem {
  id: string; // Unique ID in bin
  originalId: string; // ID of the item before deletion
  type: 'USER' | 'TASK' | 'FINANCE' | 'REPORT';
  data: any; // The full object
  deletedBy: string; // User Name
  deletedById: string; // User ID
  deletedAt: string;
}
