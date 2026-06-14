import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, Role } from "../types";
import { DB } from "../services/db";

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 60 * 1000;

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSession = () => {
      const storedUserId = localStorage.getItem("wfp_current_user_id");
      const lastActive = localStorage.getItem("wfp_last_active");

      if (storedUserId && lastActive) {
        const now = Date.now();
        const last = parseInt(lastActive, 10);

        if (now - last > SESSION_TIMEOUT) {
          logout();
        } else {
          const users = DB.users.getAll();
          const localUser = users.find((u) => u.id === storedUserId);
          if (localUser && localUser.isActive) {
            setUser(localUser);
            localStorage.setItem("wfp_last_active", now.toString());
          } else {
            logout();
          }
        }
      } else {
        localStorage.removeItem("wfp_current_user_id");
      }
    };

    checkSession();

    const interval = setInterval(checkSession, 60000);

    const updateActivity = () => {
      if (localStorage.getItem("wfp_current_user_id")) {
        localStorage.setItem("wfp_last_active", Date.now().toString());
      }
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keypress", updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keypress", updateActivity);
    };
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    let valid = false;
    if (username === "admin" && pass === "Admin@12345") valid = true;
    else if (username !== "admin" && pass === "123456") valid = true;

    if (!valid) return false;

    const users = DB.users.getAll();
    const found = users.find((u) => u.username === username);

    if (found && found.isActive) {
      setUser(found);
      localStorage.setItem("wfp_current_user_id", found.id);
      localStorage.setItem("wfp_last_active", Date.now().toString());

      DB.logs.add({
        id: Date.now().toString(),
        userId: found.id,
        action: "LOGIN",
        timestamp: new Date().toISOString(),
        details: `User ${found.username} logged in`,
      });

      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) {
      DB.logs.add({
        id: Date.now().toString(),
        userId: user.id,
        action: "LOGOUT",
        timestamp: new Date().toISOString(),
        details: `User ${user.username} logged out`,
      });
    }
    setUser(null);
    localStorage.removeItem("wfp_current_user_id");
    localStorage.removeItem("wfp_last_active");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    DB.users.update(updatedUser);
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
