'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const result = authApi.handleAuthCallback(searchParams);

        if (result.error) {
          toast.error('Đăng nhập thất bại', {
            description: result.error,
          });
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else if (result.user) {
          router.push('/');
        } else {
          toast.error('Đăng nhập thất bại', {
            description: 'Phản hồi không hợp lệ',
          });
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        }
      } catch {
        toast.error('Đăng nhập thất bại', {
          description: 'Đã có lỗi xảy ra',
        });
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}
