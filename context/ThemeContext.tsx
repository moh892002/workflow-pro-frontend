import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DB } from '../services/db';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children?: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const { user } = useAuth();

  // Load from local storage or user pref
  useEffect(() => {
    const savedTheme = localStorage.getItem('wfp_theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (user?.themePreference) {
      setTheme(user.themePreference);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, [user]);

  // Apply to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('wfp_theme', theme);
    
    // Update user pref in DB if logged in
    if (user) {
      const updatedUser = { ...user, themePreference: theme };
      DB.users.update(updatedUser);
    }
  }, [theme, user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
