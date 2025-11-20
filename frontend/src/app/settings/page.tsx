'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, ArrowRight, Loader, Save, Bell } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const ProfileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
    },
  });

  // Load email notification preference from backend
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {
        console.log('[Settings] No user ID, skipping preference load');
        return;
      }

      console.log('[Settings] Loading preferences for user:', user.id);

      try {
        const token = localStorage.getItem('auth_token');
        console.log('[Settings] Access token found:', !!token);

        if (token) {
          const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/user`;
          console.log('[Settings] Fetching from:', url);

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          console.log('[Settings] Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('[Settings] Loaded preferences:', data);
            setEmailNotifications(data.emailNotifications);
            // Sync to localStorage
            const storageKey = `emailNotifications_${user.id}`;
            localStorage.setItem(storageKey, data.emailNotifications.toString());
          } else {
            console.error('[Settings] Failed to load preferences, status:', response.status);
          }
        }
      } catch (error) {
        console.error('[Settings] Failed to load preferences:', error);
        // Fallback to localStorage
        const storageKey = `emailNotifications_${user.id}`;
        const storedPreference = localStorage.getItem(storageKey);
        console.log('[Settings] Fallback to localStorage:', storedPreference);
        if (storedPreference !== null) {
          setEmailNotifications(storedPreference === 'true');
        }
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, [user?.id]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      reset({
        fullName: user.name || '',
        email: user.email || '',
      });
    }
  }, [user, loading, router, reset]);

  const onSubmit = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch {
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailNotificationToggle = async (enabled: boolean) => {
    if (!user?.id) {
      console.log('[Settings] No user ID, cannot toggle');
      return;
    }

    console.log('[Settings] Toggling email notifications to:', enabled);

    try {
      setEmailNotifications(enabled);
      // Save to localStorage with user-specific key
      const storageKey = `emailNotifications_${user.id}`;
      localStorage.setItem(storageKey, enabled.toString());
      console.log('[Settings] Saved to localStorage:', storageKey, enabled);

      // Call API to save to backend
      const token = localStorage.getItem('auth_token');
      console.log('[Settings] Token found:', !!token);

      if (token) {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/user/email-notifications`;
        console.log('[Settings] Calling API:', url, { enabled });

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ enabled }),
        });

        console.log('[Settings] API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Settings] API error:', errorText);
          throw new Error('Failed to update preference');
        }

        const result = await response.json();
        console.log('[Settings] API success:', result);
      } else {
        console.warn('[Settings] No token, API not called');
      }

      toast.success(enabled ? 'Đã bật thông báo email' : 'Đã tắt thông báo email');
    } catch (error) {
      console.error('[Settings] Toggle failed:', error);
      toast.error('Không thể cập nhật cài đặt');
      setEmailNotifications(!enabled);
      // Revert localStorage on error
      const storageKey = `emailNotifications_${user.id}`;
      localStorage.setItem(storageKey, (!enabled).toString());
    }
  };

  if (loading || !preferencesLoaded) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="mt-4 text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Cài đặt</h1>
          <p className="text-gray-400">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-100 mb-2">
                    Họ và tên
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        {...register('fullName')}
                        id="fullName"
                        type="text"
                        className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-700 text-gray-50 placeholder-gray-300 ${
                          errors.fullName ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Nhập họ và tên"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-dark-700 rounded-lg border border-gray-600">
                      <p className="text-gray-50">{user?.name || 'Chưa cập nhật'}</p>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-100 mb-2">
                    Email
                  </label>
                  <div className="px-4 py-3 bg-dark-700 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-50">{user?.email}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        reset();
                      }}
                      disabled={saving}
                      className="px-6 py-3 border border-gray-600 text-gray-100 rounded-lg hover:bg-dark-700 hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Security Card */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <CardTitle>Bảo mật</CardTitle>
                  <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Change Password */}
                <button
                  onClick={() => router.push('/auth/change-password')}
                  className="w-full flex items-center justify-between p-4 border border-gray-600 rounded-lg hover:bg-dark-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                      <Lock className="w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-50">Đổi mật khẩu</p>
                      <p className="text-sm text-gray-100">Cập nhật mật khẩu để bảo mật tài khoản</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Notifications Card */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <CardTitle>Thông báo</CardTitle>
                  <CardDescription>Quản lý cách nhận thông báo cảnh báo giá</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* Email Notifications Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-50">Thông báo qua Email</p>
                      <p className="text-sm text-gray-100">Nhận email khi cảnh báo giá được kích hoạt</p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={handleEmailNotificationToggle}
                  />
                </div>

                {/* Email Info */}
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-primary-300 font-medium">
                      Email thông báo
                    </p>
                    <Badge variant={emailNotifications ? "default" : "secondary"}>
                      {emailNotifications ? "Đang bật" : "Đã tắt"}
                    </Badge>
                  </div>
                  <p className="text-sm text-primary-200">
                    Thông báo sẽ được gửi đến: <strong>{user?.email}</strong>
                  </p>
                </div>

                {/* Notification Description */}
                <div className="text-sm text-gray-400">
                  <p className="mb-2">Khi bật thông báo email, bạn sẽ nhận được:</p>
                  <ul className="space-y-1 list-disc list-inside text-gray-400">
                    <li>Email ngay lập tức khi giá coin đạt mức cảnh báo</li>
                    <li>Thông tin chi tiết về coin và giá hiện tại</li>
                    <li>Link để quản lý các cảnh báo khác</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}