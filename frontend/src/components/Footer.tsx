import Link from 'next/link';
import { BarChart3, Github, Mail, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-gray-600 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Crypto Tracker</h3>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Nền tảng theo dõi và quản lý cryptocurrency toàn diện, giúp bạn đầu tư thông minh và hiệu quả hơn.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@cryptotracker.com"
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors duration-200">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-blue-600 transition-colors duration-200">
                  So sánh
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors duration-200">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="hover:text-blue-600 transition-colors duration-200">
                  Trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-600 transition-colors duration-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors duration-200">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors duration-200">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Crypto Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
