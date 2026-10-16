import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState } from '@tgcloud/types';
import { api, isRunningInTauri } from '../lib/api';

interface AuthContextType {
  authState: AuthState;
  loading: boolean;
  isTauri: boolean;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  submitPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    step: 'need_phone',
    user: null,
  });
  const [loading, setLoading] = useState(true);
  const isTauri = isRunningInTauri();

  const refreshAuth = async () => {
    try {
      setLoading(true);
      const state = await api.getAuthState();
      setAuthState(state);
    } catch (err: any) {
      console.error('Failed to get auth state:', err);
      setAuthState((prev) => ({ ...prev, error: err?.message || 'Authentication error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const sendCode = async (phone: string) => {
    setLoading(true);
    try {
      await api.sendPhoneCode(phone);
      setAuthState((prev) => ({
        ...prev,
        step: 'need_code',
        phone,
        error: null,
      }));
    } catch (err: any) {
      setAuthState((prev) => ({ ...prev, error: err?.message || 'Failed to send verification code' }));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    setLoading(true);
    try {
      const user = await api.verifyPhoneCode(code);
      setAuthState((prev) => ({
        ...prev,
        step: 'authenticated',
        user,
        error: null,
      }));
    } catch (err: any) {
      if (err?.code === 'PASSWORD_REQUIRED' || err?.message?.includes('password')) {
        setAuthState((prev) => ({ ...prev, step: 'need_password', error: null }));
      } else {
        setAuthState((prev) => ({ ...prev, error: err?.message || 'Invalid verification code' }));
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (password: string) => {
    setLoading(true);
    try {
      const user = await api.submit2faPassword(password);
      setAuthState((prev) => ({
        ...prev,
        step: 'authenticated',
        user,
        error: null,
      }));
    } catch (err: any) {
      setAuthState((prev) => ({ ...prev, error: err?.message || 'Invalid 2FA password' }));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
      setAuthState({
        step: 'need_phone',
        user: null,
      });
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        loading,
        isTauri,
        sendCode,
        verifyCode,
        submitPassword,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
