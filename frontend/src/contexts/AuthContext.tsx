'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync token to cookie for middleware
    const token = authApi.getToken();
    if (token) {
      authApi.syncTokenToCookie(token);
    }
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      if (authApi.isAuthenticated()) {
        const result = await authApi.getProfile();
        if (result.user && !result.error) {
          setUser(result.user);
        } else {
          await authApi.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await authApi.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authApi.signIn({ email, password });

      console.log('SignIn API result:', {
        hasError: !!result.error,
        hasAccessToken: !!result.access_token,
        hasUser: !!result.user,
        user: result.user,
        error: result.error,
      });

      if (result.error) {
        console.error('SignIn failed with error:', result.error);
        return { success: false, error: result.error };
      }

      if (result.access_token && result.user) {
        console.log('SignIn successful, setting user');
        setUser(result.user);
        return { success: true };
      }

      console.error('SignIn failed - missing token or user');
      return { success: false, error: 'Đăng nhập thất bại - không nhận được token' };
    } catch (error) {
      console.error('SignIn error in context:', error);
      return { success: false, error: 'Đã có lỗi xảy ra' };
    }
  };

  const signOut = async () => {
    await authApi.signOut();
    setUser(null);
    window.location.href = '/';
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
