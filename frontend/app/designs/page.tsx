'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDesigns, deleteDesign, getImageUrl, type Design } from '@/lib/api';

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesigns();
    // 5초마다 상태 업데이트 (pending 상태 확인용)
    const interval = setInterval(loadDesigns, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const data = await getDesigns();
      setDesigns(data);
    } catch (error) {
      console.error('시안 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('정말 이 시안을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDesign(id);
      await loadDesigns();
      alert('시안이 삭제되었습니다.');
    } catch (error: any) {
      console.error('삭제 실패:', error);
      alert(error.message || '삭제에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            완료
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
            생성 중
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            실패
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              ← 시안 생성
            </Link>
            <Link
              href="/designs/create"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              + 새 시안 생성
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">시안 목록</h1>
          <p className="text-gray-600">생성된 시안을 확인하고 관리하세요.</p>
        </div>

        {loading && designs.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">생성된 시안이 없습니다.</p>
            <Link
              href="/designs/create"
              className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              첫 시안 생성하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div
                key={design.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group"
              >
                <Link href={`/designs/${design.id}`} className="block">
                  <div className="bg-gray-100 relative" style={{ height: '120px' }}>
                    {design.generatedImagePath ? (
                      <img
                        src={getImageUrl(design.generatedImagePath)}
                        alt="생성된 시안"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.image-error')) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'image-error flex items-center justify-center h-full text-gray-400 text-sm';
                            errorDiv.textContent = '이미지 로드 실패';
                            parent.appendChild(errorDiv);
                          }
                        }}
                        loading="lazy"
                      />
                    ) : design.status === 'pending' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                          <p className="text-xs text-gray-600">생성 중...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <p className="text-xs text-gray-400">이미지 없음</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {design.baseProduct?.name || '시안'}
                      </h3>
                      {getStatusBadge(design.status)}
                    </div>
                    {design.text && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{design.text}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(design.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(design.id, e)}
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

