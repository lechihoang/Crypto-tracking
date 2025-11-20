'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any old localStorage tokens (migration to HttpOnly cookies)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('id_token');
    }
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const result = await authApi.getProfile();
      if (result.user && !result.error) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authApi.signIn({ email, password });

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.user) {
        setUser(result.user);
        return { success: true };
      }

      return { success: false, error: 'Đăng nhập thất bại' };
    } catch (error) {
      return { success: false, error: 'Đã có lỗi xảy ra' };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
      setUser(null);
      // Use window.location for clean logout
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
