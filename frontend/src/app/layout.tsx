import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatBubble from "@/components/ChatBubble";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CommandPalette } from "@/components/CommandPalette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Tracker - Theo dõi giá tiền điện tử",
  description: "Ứng dụng theo dõi giá tiền điện tử real-time với tính năng tìm kiếm, so sánh và thông tin chi tiết các đồng coin hàng đầu",
  keywords: ["crypto", "cryptocurrency", "bitcoin", "ethereum", "price tracker", "crypto news"],
  authors: [{ name: "Crypto Tracker Team" }],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <ChatBubble />
          <CommandPalette />
          <Toaster position="bottom-right" duration={5000} />
        </AuthProvider>
      </body>
    </html>
  );
}
