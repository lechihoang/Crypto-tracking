/**
 * Authentication-related types
 */

// User object
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

// Auth Context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  password: string;
  accessToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user?: User;
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  message?: string;
  error?: string;
}
