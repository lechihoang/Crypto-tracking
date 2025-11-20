'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { SignUpSchema, SignUpFormData } from '@/lib/validations';
import { Mail, User, Loader, CheckCircle } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    getValues
  } = useForm<SignUpFormData>({
    resolver: zodResolver(SignUpSchema),
    mode: 'onChange', // Validate on every change
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    setError('');

    try {
      const result = await authApi.signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
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

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full">
          <Card className="shadow-md text-center">
            <CardContent className="pt-10">
              <div className="mx-auto h-16 w-16 bg-success-500/20 rounded-full flex items-center justify-center mb-4 border border-success-500/40">
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Đăng ký thành công!
              </h2>
              <p className="text-gray-100 mb-6">
                Chúng tôi đã gửi email xác nhận đến <strong className="text-primary-400">{getValues('email')}</strong>.
                Vui lòng kiểm tra email và nhấp vào liên kết để kích hoạt tài khoản.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Đăng nhập ngay
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    Quay về trang chủ
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Tạo tài khoản</CardTitle>
            <CardDescription>
              Tham gia Crypto Tracker để theo dõi danh mục của bạn
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
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="text-gray-100 font-semibold">
                  Họ và tên
                </Label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-300" />
                  </div>
                  <Input
                    {...register('fullName')}
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    onFocus={handleInputFocus}
                    className={`pl-10 ${errors.fullName ? 'border-danger-500/40' : ''}`}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-danger-400">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-100 font-semibold">
                  Email
                </Label>
                <div className="relative mt-2">
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
                  autoComplete="new-password"
                  onFocus={handleInputFocus}
                  className={`mt-2 ${errors.password ? 'border-danger-500/40' : ''}`}
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-100 font-semibold">
                  Xác nhận mật khẩu
                </Label>
                <PasswordInput
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  autoComplete="new-password"
                  onFocus={handleInputFocus}
                  className={`mt-2 ${errors.confirmPassword ? 'border-danger-500/40' : ''}`}
                  placeholder="Nhập lại mật khẩu"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-400">{errors.confirmPassword.message}</p>
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
                'Tạo tài khoản'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-100">Hoặc đăng ký với</span>
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

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-gray-100">Đã có tài khoản? </span>
              <Link
                href="/auth/login"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}