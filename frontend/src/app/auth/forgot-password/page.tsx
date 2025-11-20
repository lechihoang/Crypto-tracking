'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { ForgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations';
import { Mail, Loader, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setError('');

    try {
      const result = await authApi.resetPassword({ email: data.email });

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
        <div className="max-w-md w-full">
          <Card className="shadow-md text-center">
            <CardContent className="pt-10">
              <div className="mx-auto h-16 w-16 bg-success-500/20 rounded-full flex items-center justify-center mb-4 border border-success-500/40">
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Email đã được gửi!
              </h2>
              <p className="text-gray-100 mb-6">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong className="text-primary-400">{getValues('email')}</strong>.
                Vui lòng kiểm tra email và làm theo hướng dẫn.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Quay về đăng nhập
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSuccess(false)}
                  className="w-full"
                >
                  Gửi lại email
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
      <div className="max-w-md w-full">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Quên mật khẩu?</CardTitle>
            <CardDescription>
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full"
            >
              {loading || isSubmitting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Gửi liên kết đặt lại'
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