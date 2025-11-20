'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, User, LogOut, Menu, X, Settings, Wallet, Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export default function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-dark-900/95 backdrop-blur-md border-b border-dark-600/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group">
              <div className="p-2 bg-primary-500 rounded-lg transition-all duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Crypto Tracker</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link
              href="/compare"
              className="relative px-4 py-2 font-medium text-gray-100 hover:text-white transition-colors duration-200 group"
            >
              Bảng giá
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 transition-transform duration-200 origin-center ${pathname === '/compare' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="relative px-4 py-2 font-medium text-gray-100 hover:text-white transition-colors duration-200 group"
                >
                  Tổng quan
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 transition-transform duration-200 origin-center ${pathname === '/dashboard' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </Link>
                <Link
                  href="/portfolio"
                  className="relative px-4 py-2 font-medium text-gray-100 hover:text-white transition-colors duration-200 group"
                >
                  Danh mục theo dõi
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 transition-transform duration-200 origin-center ${pathname === '/portfolio' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </Link>
                <Link
                  href="/alerts"
                  className="relative px-4 py-2 font-medium text-gray-100 hover:text-white transition-colors duration-200 group"
                >
                  Cảnh báo
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 transition-transform duration-200 origin-center ${pathname === '/alerts' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </Link>
              </>
            )}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <TooltipProvider>
                {/* Notification Bell */}
                <NotificationDropdown />

                {/* User Menu */}
                <div className="relative">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 p-2 rounded-sm hover:bg-dark-700 transition-all duration-200"
                      >
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {user.name || user.email?.split('@')[0]}
                        </span>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{user.name || 'User'}</h4>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Click to access your account settings and preferences
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-dark-800 rounded-lg border border-dark-600 backdrop-blur-md py-2 z-50">
                      <div className="px-4 py-2 border-b border-dark-600">
                        <p className="text-sm font-semibold text-white">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-100">{user.email}</p>
                      </div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 hover:bg-dark-700 hover:text-white transition-all duration-200 rounded-md mx-2"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BarChart3 className="w-4 h-4" />
                            Tổng quan
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>View your portfolio dashboard</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href="/alerts"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 hover:bg-dark-700 hover:text-white transition-all duration-200 rounded-md mx-2"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Bell className="w-4 h-4" />
                            Cảnh báo giá
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Manage your price alerts</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href="/settings"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 hover:bg-dark-700 hover:text-white transition-all duration-200 rounded-md mx-2"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Cài đặt
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Configure your account settings</p>
                        </TooltipContent>
                      </Tooltip>

                      <hr className="my-2 border-dark-600" />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-500 hover:bg-danger-500/10 transition-all duration-200 rounded-md mx-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Sign out of your account</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-100 hover:text-white font-medium transition-all duration-300"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all duration-300"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-lg hover:bg-dark-700 text-gray-100 transition-all duration-300"
                  >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMenuOpen ? 'Close menu' : 'Open menu'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-dark-600/50 pt-4">
            <div className="space-y-2">
              <Link
                href="/compare"
                className="block px-4 py-2 text-gray-100 hover:text-white hover:bg-dark-700 rounded-lg transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Bảng giá
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-gray-100 hover:text-white hover:bg-dark-700 rounded-lg transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tổng quan
                  </Link>
                  <Link
                    href="/portfolio"
                    className="block px-4 py-2 text-gray-100 hover:text-white hover:bg-dark-700 rounded-lg transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Danh mục theo dõi
                  </Link>
                  <Link
                    href="/alerts"
                    className="block px-4 py-2 text-gray-100 hover:text-white hover:bg-dark-700 rounded-lg transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Cảnh báo
                  </Link>
                  <div className="border-t border-dark-600/50 pt-2 mt-2">
                    <div className="px-4 py-2">
                      <p className="text-sm font-semibold text-white">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-100">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-500 hover:bg-danger-500/10 rounded-lg transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-dark-600/50 pt-2 mt-2 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-gray-100 hover:text-white hover:bg-dark-700 rounded-lg transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all duration-300 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}