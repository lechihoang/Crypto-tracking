'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { ResetPasswordSchema, ResetPasswordFormData } from '@/lib/validations';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Extract access token from URL hash
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const type = params.get('type');

      if (token && type === 'recovery') {
        setAccessToken(token);
      } else {
        setTokenError(true);
      }
    } else {
      setTokenError(true);
    }
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!accessToken) {
      setError('Token không hợp lệ hoặc đã hết hạn');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authApi.updatePassword({
        password: data.password,
        accessToken: accessToken,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
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

  if (tokenError) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-md text-center">
            <CardContent className="pt-10">
              <div className="mx-auto h-16 w-16 bg-danger-500/20 rounded-full flex items-center justify-center mb-4 border border-danger-500/40">
                <AlertCircle className="h-8 w-8 text-danger-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Liên kết không hợp lệ
              </h2>
              <p className="text-gray-100 mb-6">
                Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu một liên kết mới.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth/forgot-password">
                    Yêu cầu liên kết mới
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login">
                    Quay về đăng nhập
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-md text-center">
            <CardContent className="pt-10">
              <div className="mx-auto h-16 w-16 bg-success-500/20 rounded-full flex items-center justify-center mb-4 border border-success-500/40">
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Đặt lại mật khẩu thành công!
              </h2>
              <p className="text-gray-100 mb-6">
                Mật khẩu của bạn đã được cập nhật thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập sau 3 giây.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Đăng nhập ngay
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Đặt lại mật khẩu</CardTitle>
            <CardDescription>
              Nhập mật khẩu mới cho tài khoản của bạn
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-danger-500/20 border border-danger-500/40 text-danger-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-gray-100 font-semibold">
                Mật khẩu mới
              </Label>
              <PasswordInput
                {...register('password')}
                id="password"
                autoComplete="new-password"
                onFocus={handleInputFocus}
                className={`mt-2 ${errors.password ? 'border-danger-500/40' : ''}`}
                placeholder="Nhập mật khẩu mới"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-danger-400">{errors.password.message}</p>
              )}
            </div>

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
                placeholder="Xác nhận mật khẩu mới"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || isSubmitting || !accessToken}
              className="w-full"
            >
              {loading || isSubmitting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Cập nhật mật khẩu'
              )}
            </Button>

            {/* Back to Login */}
            <div className="text-center text-sm">
              <span className="text-gray-100">Nhớ mật khẩu? </span>
              <Link
                href="/auth/login"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Đăng nhập
              </Link>
            </div>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}