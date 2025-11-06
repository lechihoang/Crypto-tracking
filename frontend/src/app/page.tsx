'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiBitcoin, SiEthereum, SiLitecoin, SiDogecoin, SiRipple, SiBinance } from 'react-icons/si';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-4">
          {/* Section 1: 12 cột trên mobile/tablet, 5 cột trên desktop */}
          <section className="col-span-12 xl:col-span-5 bg-white rounded-lg shadow flex flex-col justify-between p-8">
            <div>
              <h1 className="text-5xl xl:text-6xl text-gray-700 font-bold mb-20">
                Theo dõi crypto của bạn dễ dàng với <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Crypto Tracker</span>
              </h1>
              <p className="text-lg xl:text-xl text-gray-700 mb-8">
                Nắm bắt mọi thông tin, xu hướng về đồng tiền ảo. Theo dõi biến động giá, phân tích lãi/lỗ và xu hướng tài sản crypto của bạn - chỉ với một trang web duy nhất.
              </p>
            </div>
            <Link href="/dashboard" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center">
              Đăng nhập ngay
            </Link>
          </section>

          {/* Section 2: 12 cột trên mobile/tablet, 7 cột trên desktop */}
          <section className="col-span-12 xl:col-span-7 bg-white rounded-lg shadow overflow-hidden">
            <Image
              src="/images/dashboard-preview.png"
              alt="Dashboard Preview"
              width={1200}
              height={800}
              className="w-full h-auto object-contain"
            />
          </section>
        </div>

        {/* Section 3: Floating coins section */}
        <div className="relative mt-16 py-20 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl">
          {/* Floating coins with real icons - Nhiều đồng coin hơn */}
          <div className="absolute top-10 left-10 animate-bounce">
            <SiBitcoin className="text-6xl text-orange-500" />
          </div>
          <div className="absolute top-20 right-20 animate-pulse" style={{animationDelay: '0.5s'}}>
            <SiEthereum className="text-5xl text-blue-600" />
          </div>
          <div className="absolute bottom-20 left-20 animate-bounce" style={{animationDelay: '1s'}}>
            <SiBinance className="text-4xl text-yellow-500" />
          </div>
          <div className="absolute top-1/2 right-10 animate-pulse" style={{animationDelay: '1.5s'}}>
            <SiRipple className="text-5xl text-blue-400" />
          </div>
          <div className="absolute bottom-10 right-1/4 animate-bounce" style={{animationDelay: '2s'}}>
            <SiLitecoin className="text-4xl text-gray-400" />
          </div>
          <div className="absolute top-1/3 left-1/4 animate-pulse" style={{animationDelay: '0.3s'}}>
            <SiDogecoin className="text-5xl text-yellow-600" />
          </div>
          
          {/* Thêm nhiều coin hơn */}
          <div className="absolute top-40 left-1/3 animate-bounce" style={{animationDelay: '0.8s'}}>
            <FaBitcoin className="text-5xl text-orange-400 opacity-70" />
          </div>
          <div className="absolute bottom-32 right-1/3 animate-pulse" style={{animationDelay: '1.2s'}}>
            <FaEthereum className="text-4xl text-purple-500 opacity-60" />
          </div>
          <div className="absolute top-1/4 right-1/4 animate-bounce" style={{animationDelay: '1.8s'}}>
            <SiBitcoin className="text-3xl text-orange-300 opacity-50" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-pulse" style={{animationDelay: '2.3s'}}>
            <SiEthereum className="text-4xl text-blue-400 opacity-60" />
          </div>
          <div className="absolute top-1/2 left-1/2 animate-bounce" style={{animationDelay: '0.7s'}}>
            <SiRipple className="text-3xl text-cyan-400 opacity-40" />
          </div>
          <div className="absolute top-16 right-1/3 animate-pulse" style={{animationDelay: '1.4s'}}>
            <SiLitecoin className="text-5xl text-slate-400 opacity-70" />
          </div>
          <div className="absolute bottom-16 left-1/2 animate-bounce" style={{animationDelay: '2.5s'}}>
            <SiBinance className="text-4xl text-amber-500 opacity-50" />
          </div>
          <div className="absolute top-2/3 right-16 animate-pulse" style={{animationDelay: '0.9s'}}>
            <SiDogecoin className="text-3xl text-yellow-500 opacity-60" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Hỗ trợ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">hơn 10,000+</span> loại cryptocurrency
            </h2>
            <p className="text-xl text-gray-600">
              Từ Bitcoin, Ethereum đến các altcoin mới nhất. Theo dõi toàn bộ danh mục đầu tư của bạn ở một nơi.
            </p>
          </div>
        </div>

        {/* Section 4: Portfolio - 6/6 */}

        {/* Section 5: So sánh giá real-time - 6/6 */}
        <div className="grid grid-cols-12 gap-4 mt-16">
          {/* Compare Price Content: 6 cột trên desktop */}
          <section className="col-span-12 xl:col-span-6 bg-white p-8 rounded-lg shadow flex flex-col justify-between">
            <div className="mb-8">
              <h2 className="text-5xl font-bold text-gray-800 mb-8">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">So sánh giá</span> real-time
              </h2>
              <p className="text-xl text-gray-700 mb-8">
                Theo dõi giá crypto theo thời gian thực với bảng so sánh chi tiết. Đặt cảnh báo giá thông minh để không bỏ lỡ cơ hội đầu tư.
              </p>
              <ul className="space-y-3 text-lg text-gray-700 list-disc list-inside">
                <li>Bảng so sánh giá 10,000+ đồng coin</li>
                <li>Cập nhật giá theo thời gian thực</li>
                <li>Đặt cảnh báo giá tùy chỉnh</li>
                <li>Xem biểu đồ giá 24h, 7 ngày, 30 ngày</li>
              </ul>
            </div>
            <Link href="/compare" className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center justify-center">
              Khám phá
            </Link>
          </section>

          {/* Compare Price Image/Preview: 6 cột trên desktop */}
          <section className="col-span-12 xl:col-span-6 bg-white rounded-lg shadow overflow-hidden">
            <Image
              src="/images/price-alert-preview.png"
              alt="Price Comparison Preview"
              width={800}
              height={600}
              className="w-full h-full min-h-[400px] object-cover"
            />
          </section>
        </div>

        {/* Section 6: Chatbot Crypto - 6/6 */}
        <div className="grid grid-cols-12 gap-4 mt-16">
          {/* Chatbot Image/Preview: 6 cột trên desktop */}
          <section className="col-span-12 xl:col-span-6 bg-white rounded-lg shadow overflow-hidden">
            <Image
              src="/images/chatbot-preview.jpg"
              alt="Chatbot Preview"
              width={800}
              height={600}
              className="w-full h-full min-h-[400px] object-cover"
            />
          </section>

          {/* Chatbot Content: 6 cột trên desktop */}
          <section className="col-span-12 xl:col-span-6 bg-white p-8 rounded-lg shadow flex flex-col justify-between">
            <div className="mb-8">
              <h2 className="text-5xl font-bold text-gray-800 mb-8">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">AI Chatbot</span> hỗ trợ crypto
              </h2>
              <p className="text-xl text-gray-700 mb-8">
                Trợ lý AI thông minh giúp bạn phân tích thị trường, trả lời câu hỏi về cryptocurrency và đưa ra insights từ dữ liệu thời gian thực.
              </p>
              <ul className="space-y-3 text-lg text-gray-700 list-disc list-inside">
                <li>Phân tích thị trường bằng AI</li>
                <li>Trả lời câu hỏi 24/7</li>
                <li>Insights từ dữ liệu thực tế</li>
              </ul>
            </div>
            <button
              onClick={() => {
                // Trigger click on chat bubble button
                const chatButton = document.querySelector('[aria-label="Open crypto assistant chat"]') as HTMLButtonElement;
                if (chatButton) chatButton.click();
              }}
              className="bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-cyan-700 transition-colors inline-flex items-center justify-center"
            >
              Trò chuyện
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
