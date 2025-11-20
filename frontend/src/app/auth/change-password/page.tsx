'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { ChangePasswordSchema, ChangePasswordFormData } from '@/lib/validations';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    clearErrors,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);

    try {
      const changePasswordPromise = (async () => {
        const result = await authApi.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        reset();
        setTimeout(() => {
          router.push('/settings');
        }, 1500);
        return result;
      })();

      toast.promise(
        changePasswordPromise,
        {
          loading: 'Đang đổi mật khẩu...',
          success: 'Đã đổi mật khẩu thành công!',
          error: (err) => err.message || 'Không thể đổi mật khẩu',
        }
      );

      await changePasswordPromise;
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    clearErrors();
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Đổi mật khẩu</CardTitle>
            <CardDescription>
              Cập nhật mật khẩu để bảo mật tài khoản tốt hơn
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <Label htmlFor="currentPassword" className="text-gray-100 font-semibold">
                  Mật khẩu hiện tại
                </Label>
                <PasswordInput
                  {...register('currentPassword')}
                  id="currentPassword"
                  autoComplete="current-password"
                  onFocus={handleInputFocus}
                  className={`mt-2 ${errors.currentPassword ? 'border-danger-500/40' : ''}`}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-danger-400">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="newPassword" className="text-gray-100 font-semibold">
                  Mật khẩu mới
                </Label>
                <PasswordInput
                  {...register('newPassword')}
                  id="newPassword"
                  autoComplete="new-password"
                  onFocus={handleInputFocus}
                  className={`mt-2 ${errors.newPassword ? 'border-danger-500/40' : ''}`}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-danger-400">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-100 font-semibold">
                  Xác nhận mật khẩu mới
                </Label>
                <PasswordInput
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  autoComplete="new-password"
                  onFocus={handleInputFocus}
                  className={`mt-2 ${errors.confirmPassword ? 'border-danger-500/40' : ''}`}
                  placeholder="Nhập lại mật khẩu mới"
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
                'Đổi mật khẩu'
              )}
            </Button>

          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
