import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, Role } from "../types";
import { DB } from "../services/db";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase"; // تأكد من وجود هذا الملف

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // جلب بيانات المستخدم من Firestore
  const fetchUserFromFirestore = async (
    userId: string
  ): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
    } catch (error) {
      console.error("Error fetching user from Firestore:", error);
    }
    return null;
  };

  // حفظ المستخدم في Firestore
  const saveUserToFirestore = async (userData: User) => {
    try {
      await setDoc(
        doc(db, "users", userData.id),
        {
          ...userData,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      ); // merge للحفاظ على البيانات الأخرى
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
    }
  };

  // Check session on load
  useEffect(() => {
    const checkSession = async () => {
      const storedUserId = localStorage.getItem("wfp_current_user_id");
      const lastActive = localStorage.getItem("wfp_last_active");

      if (storedUserId && lastActive) {
        const now = Date.now();
        const last = parseInt(lastActive, 10);

        if (now - last > SESSION_TIMEOUT) {
          logout(); // Session expired
        } else {
          // جلب البيانات المحدثة من Firestore
          const firestoreUser = await fetchUserFromFirestore(storedUserId);

          if (firestoreUser && firestoreUser.isActive) {
            setUser(firestoreUser); // استخدام البيانات من Firestore
            localStorage.setItem("wfp_last_active", now.toString());
          } else {
            logout(); // User deleted or deactivated
          }
        }
      } else {
        // Clear potential stale data
        localStorage.removeItem("wfp_current_user_id");
      }
    };

    checkSession();

    // Interval check for timeout
    const interval = setInterval(checkSession, 60000); // Check every minute

    // Activity listeners to refresh session
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
    // Verify password (Mock)
    let valid = false;
    if (username === "admin" && pass === "Admin@12345") valid = true;
    else if (username !== "admin" && pass === "123456") valid = true;

    if (!valid) return false;

    const users = DB.users.getAll();
    const found = users.find((u) => u.username === username);

    if (found && found.isActive) {
      // حفظ في Firestore أولاً
      await saveUserToFirestore(found);

      // حفظ ID فقط في localStorage
      setUser(found);
      localStorage.setItem("wfp_current_user_id", found.id);
      localStorage.setItem("wfp_last_active", Date.now().toString());

      // حفظ اللوج في Firestore أيضاً
      try {
        await setDoc(doc(db, "logs", Date.now().toString()), {
          userId: found.id,
          action: "LOGIN",
          timestamp: serverTimestamp(),
          details: `User ${found.username} logged in`,
        });
      } catch (error) {
        console.error("Error saving log to Firestore:", error);
      }

      return true;
    }
    return false;
  };

  const logout = async () => {
    if (user) {
      try {
        // حفظ اللوج في Firestore
        await setDoc(doc(db, "logs", Date.now().toString()), {
          userId: user.id,
          action: "LOGOUT",
          timestamp: serverTimestamp(),
          details: `User ${user.username} logged out`,
        });
      } catch (error) {
        console.error("Error saving logout log:", error);
      }
    }
    setUser(null);
    localStorage.removeItem("wfp_current_user_id");
    localStorage.removeItem("wfp_last_active");
  };

  const updateUser = async (updatedUser: User) => {
    // تحديث Firestore أولاً
    await saveUserToFirestore(updatedUser);

    // ثم تحديث الحالة المحلية
    setUser(updatedUser);

    // تحديث DB المحلية أيضاً للتوافق
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
