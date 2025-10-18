'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, Tag, Loader } from 'lucide-react';
import Link from 'next/link';

interface NewsArticle {
  id: string;
  title: string;
  body: string;
  titleVi?: string;
  bodyVi?: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: number;
  categories: string[];
}

export default function BlogPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crypto/news/vi?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      setNews(data);
    } catch (err) {
      setError('Không thể tải tin tức. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải tin tức...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchNews}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full pb-8">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
          
            <h1 className="text-3xl font-bold text-gray-900">Tin tức Crypto</h1>
          </div>
          <p className="text-gray-600">
            Những thông tin mới nhất về thị trường tiền điện tử trên thế giới
          </p>
        </div>
      </div>

      {/* News Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="20" font-weight="bold"%3ECrypto News%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Categories */}
                {article.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.categories.slice(0, 2).map((category, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                      >
                        <Tag className="w-3 h-3" />
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {article.titleVi || article.title}
                </h2>

                {/* Body */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {truncateText(article.bodyVi || article.body, 150)}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <span className="font-medium text-blue-600">{article.source}</span>
                </div>

                {/* Read More Button */}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đọc thêm
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {news.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <p className="text-gray-600">Không có tin tức nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
