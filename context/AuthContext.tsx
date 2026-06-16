import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { User, Role } from "../types";
import api from "../services/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 60 * 1000;

function mapBackendUser(data: any): User {
  return {
    id: String(data.id),
    fullName: data.fullname || "",
    username: data.username || "",
    role: data.role || Role.EMPLOYEE,
    department: data.department?.name || data.department || "",
    salary: data.salary,
    isActive: data.deleted_at === null,
    profileImage: data.image_url || "",
    jobTitle: data.job_title || "",
    isBot: false,
  };
}

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const lastUserRef = useRef<string>("");

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const token = localStorage.getItem("wfp_token");
      const lastActive = localStorage.getItem("wfp_last_active");

      if (!token || !lastActive) {
        localStorage.removeItem("wfp_token");
        localStorage.removeItem("wfp_current_user_id");
        return;
      }

      const now = Date.now();
      const last = parseInt(lastActive, 10);

      if (now - last > SESSION_TIMEOUT) {
        logout();
        return;
      }

      try {
        const res = await api.get("/user");
        if (!mounted) return;
        const mapped = mapBackendUser(res.data);
        const snapshot = JSON.stringify(mapped);
        if (snapshot !== lastUserRef.current) {
          lastUserRef.current = snapshot;
          setUser(mapped);
        }
        localStorage.setItem("wfp_current_user_id", mapped.id);
        localStorage.setItem("wfp_last_active", now.toString());
      } catch (err: any) {
        if (!mounted) return;
        if (err?.response?.status === 401) {
          logout();
        }
      }
    };

    checkSession();

    const interval = setInterval(checkSession, 60000);

    const updateActivity = () => {
      if (localStorage.getItem("wfp_token")) {
        localStorage.setItem("wfp_last_active", Date.now().toString());
      }
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keypress", updateActivity);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keypress", updateActivity);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post("/login", { email, password });
      const { token, user: backendUser } = res.data;

      localStorage.setItem("wfp_token", token);
      const mapped = mapBackendUser(backendUser);
      setUser(mapped);
      localStorage.setItem("wfp_current_user_id", mapped.id);
      localStorage.setItem("wfp_last_active", Date.now().toString());

      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Ignore errors, still clear local state
    }
    setUser(null);
    localStorage.removeItem("wfp_token");
    localStorage.removeItem("wfp_current_user_id");
    localStorage.removeItem("wfp_last_active");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
