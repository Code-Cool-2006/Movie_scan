import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StaffUser } from '../types';
import { storage } from '../utils/storage';
import {
  MOCK_STAFF_USERS,
} from '../services/mockData';
import {
  getStoredBaseUrl,
  setStoredBaseUrl,
  isMockModeActive,
  setMockModeActive,
  setAuthToken,
  apiRequest,
} from '../services/api';

const USER_STORAGE_KEY = '@moviescan_staff_user';

interface AuthContextType {
  user: StaffUser | null;
  isLoading: boolean;
  isMockMode: boolean;
  baseUrl: string;
  login: (email: string, password?: string) => Promise<void>;
  loginAsDemoGuard: (staffId: number) => Promise<void>;
  logout: () => Promise<void>;
  setBaseUrlConfig: (url: string) => Promise<void>;
  toggleMockMode: (active: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMockMode, setIsMockModeState] = useState<boolean>(true);
  const [baseUrl, setBaseUrlState] = useState<string>('http://localhost:5000');

  useEffect(() => {
    async function initAuth() {
      try {
        const storedUrl = await getStoredBaseUrl();
        const storedMock = await isMockModeActive();
        const storedUserJson = await storage.getItem(USER_STORAGE_KEY);

        setBaseUrlState(storedUrl);
        setIsMockModeState(storedMock);

        if (storedUserJson) {
          const parsed = JSON.parse(storedUserJson);
          setUser(parsed);
          await setAuthToken(parsed.token || null);
        } else {
          // Default to Demo Guard Alice for instant start
          const defaultGuard = MOCK_STAFF_USERS[0];
          setUser(defaultGuard);
          await storage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultGuard));
          await setAuthToken(defaultGuard.token || null);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password = '') => {
    setIsLoading(true);
    try {
      const mockActive = await isMockModeActive();

      if (!mockActive) {
        try {
          const res = await apiRequest<{ token: string; user: StaffUser }>('/api/auth/login', {
            method: 'POST',
            body: { email, password },
          });

          if (res.user.role !== 'staff' && res.user.role !== 'admin') {
            throw new Error('Access denied: Customer accounts cannot access the Guard App.');
          }

          const loggedInUser: StaffUser = {
            ...res.user,
            token: res.token,
          };
          setUser(loggedInUser);
          await storage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
          await setAuthToken(res.token);
          return;
        } catch (apiErr: any) {
          console.warn('Server login failed, checking local credentials:', apiErr.message);
        }
      }

      // Mock login check
      const matched = MOCK_STAFF_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (!matched) {
        throw new Error('Invalid staff credentials. Try alice@cinema.com or bob@cinema.com');
      }

      setUser(matched);
      await storage.setItem(USER_STORAGE_KEY, JSON.stringify(matched));
      await setAuthToken(matched.token || null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoGuard = async (staffId: number) => {
    const matched = MOCK_STAFF_USERS.find((u) => u.id === staffId) || MOCK_STAFF_USERS[0];
    setUser(matched);
    await storage.setItem(USER_STORAGE_KEY, JSON.stringify(matched));
    await setAuthToken(matched.token || null);
  };

  const logout = async () => {
    setUser(null);
    await storage.removeItem(USER_STORAGE_KEY);
    await setAuthToken(null);
  };

  const setBaseUrlConfig = async (newUrl: string) => {
    setBaseUrlState(newUrl);
    await setStoredBaseUrl(newUrl);
  };

  const toggleMockMode = async (active: boolean) => {
    setIsMockModeState(active);
    await setMockModeActive(active);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isMockMode,
        baseUrl,
        login,
        loginAsDemoGuard,
        logout,
        setBaseUrlConfig,
        toggleMockMode,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
