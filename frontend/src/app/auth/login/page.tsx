'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { SignInSchema, SignInFormData } from '@/lib/validations';
import { Mail, Loader } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors
  } = useForm<SignInFormData>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn(data.email, data.password);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Đăng nhập thành công, redirect đến dashboard
        const redirectTo = new URLSearchParams(window.location.search).get('redirectTo');
        window.location.href = redirectTo || '/dashboard';
      } else {
        setError('Đăng nhập thất bại');
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    setError('');
    clearErrors();
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Đăng nhập</CardTitle>
            <CardDescription>
              Chào mừng bạn trở lại với Crypto Tracker
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-danger-500/20 border border-danger-500/40 text-danger-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-100 font-semibold">
                  Email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-300" />
                  </div>
                  <Input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    onFocus={handleInputFocus}
                    className={`pl-10 ${errors.email ? 'border-danger-500/40' : ''}`}
                    placeholder="Nhập email của bạn"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-gray-100 font-semibold">
                  Mật khẩu
                </Label>
                <PasswordInput
                  {...register('password')}
                  id="password"
                  autoComplete="current-password"
                  onFocus={handleInputFocus}
                  className={`mt-2 ${errors.password ? 'border-danger-500/40' : ''}`}
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full"
            >
              {loading || isSubmitting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Đăng nhập'
              )}
            </Button>

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Quên mật khẩu?
              </Link>
              <Link
                href="/auth/register"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Tạo tài khoản mới
              </Link>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-100">Hoặc đăng nhập với</span>
              </div>
            </div>

            {/* Social Login Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => authApi.loginWithGoogle()}
              className="w-full"
            >
              <FaGoogle className="w-5 h-5 mr-2 text-red-500" />
              Google
            </Button>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}