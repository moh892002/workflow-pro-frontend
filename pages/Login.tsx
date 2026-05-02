import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Briefcase, Lock, User as UserIcon } from "lucide-react";

export const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay for realism
    setTimeout(async () => {
      const success = await login(username, password);
      if (success) {
        // Login successful - router will handle navigation automatically
        setIsLoading(false);
      } else {
        // Login failed
        setError(t("error_login"));
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md mx-4 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-primary rounded-2xl mb-4 shadow-lg shadow-blue-900/20">
            <Briefcase size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            WorkFlow Pro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Enterprise Management System
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-medium border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input
              type="text"
              id="username"
              required
              className="peer w-full pl-4 pr-4 pt-6 pb-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition placeholder-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username" // Kept for peer-shown logic, but visually hidden
            />
            <label
              htmlFor="username"
              className="absolute left-4 top-2 text-xs text-slate-400 dark:text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-accent"
            >
              {t("username")}
            </label>
          </div>

          <div className="relative group">
            <input
              type="password"
              id="password"
              required
              className="peer w-full pl-4 pr-4 pt-6 pb-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition placeholder-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2 text-xs text-slate-400 dark:text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-accent"
            >
              {t("password")}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-4"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t("login_btn")
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
          {/* Security Update: Pre-filled credentials removed as per request */}
        </div>
      </div>

      <div className="mt-8 text-slate-400 dark:text-slate-500 text-sm font-medium">
        WorkFlow Pro – Enterprise Management System
      </div>
    </div>
  );
};
