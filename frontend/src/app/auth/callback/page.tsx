'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const result = authApi.handleAuthCallback(searchParams);

        if (result.error) {
          setStatus('error');
          setErrorMessage(result.error);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else if (result.user) {
          setStatus('success');
          
          // Wait a bit for cookies to be set, then verify authentication
          setTimeout(async () => {
            try {
              // Verify the user is actually authenticated by checking /auth/me
              const profileResult = await authApi.getProfile();
              if (profileResult.user && !profileResult.error) {
                // Authentication confirmed, redirect to dashboard
                router.push('/dashboard');
              } else {
                // Cookie not working, show error
                setStatus('error');
                setErrorMessage('Authentication failed - please try again');
                setTimeout(() => {
                  router.push('/auth/login');
                }, 3000);
              }
            } catch {
              setStatus('error');
              setErrorMessage('Authentication verification failed');
              setTimeout(() => {
                router.push('/auth/login');
              }, 3000);
            }
          }, 500);
        } else {
          setStatus('error');
          setErrorMessage('Authentication failed - invalid response');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } catch {
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-gray-800 rounded-xl shadow-card border border-gray-600/50 backdrop-blur-sm p-10 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto h-16 w-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
                <Loader className="h-8 w-8 text-primary-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Đang xác thực...
              </h2>
              <p className="text-gray-300">
                Vui lòng đợi trong giây lát
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto h-16 w-16 bg-success-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Đăng nhập thành công!
              </h2>
              <p className="text-gray-300">
                Đang chuyển hướng đến dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto h-16 w-16 bg-danger-500/20 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-danger-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Đăng nhập thất bại
              </h2>
              <p className="text-gray-300 mb-4">
                {errorMessage || 'Đã có lỗi xảy ra trong quá trình đăng nhập'}
              </p>
              <p className="text-sm text-gray-400">
                Đang chuyển hướng về trang đăng nhập...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-gray-800 rounded-xl shadow-card border border-gray-600/50 backdrop-blur-sm p-10 text-center">
            <div className="mx-auto h-16 w-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
              <Loader className="h-8 w-8 text-primary-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Đang xác thực...
            </h2>
            <p className="text-gray-300">
              Vui lòng đợi trong giây lát
            </p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
