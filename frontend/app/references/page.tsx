'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferences, getBaseProducts, createReference, getImageUrl, type Reference, type BaseProduct } from '@/lib/api';

export default function ReferencesPage() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [baseProducts, setBaseProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ baseProductId: '', description: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [refs, products] = await Promise.all([getReferences(), getBaseProducts()]);
      setReferences(refs);
      setBaseProducts(products);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !formData.baseProductId) {
      alert('기본형과 이미지를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('baseProductId', formData.baseProductId);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('image', imageFile);

      await createReference(formDataToSend);
      await loadData();
      setShowForm(false);
      setFormData({ baseProductId: '', description: '' });
      setImageFile(null);
      alert('레퍼런스가 등록되었습니다.');
    } catch (error: any) {
      console.error('등록 실패:', error);
      alert(error.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
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
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              {showForm ? '취소' : '+ 레퍼런스 등록'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {showForm && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">레퍼런스 등록</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기본형 선택 *
                </label>
                <select
                  value={formData.baseProductId}
                  onChange={(e) => setFormData({ ...formData, baseProductId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">선택하세요</option>
                  {baseProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : references.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 레퍼런스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {references.map((reference) => (
              <div
                key={reference.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {reference.imagePath ? (
                    <img
                      src={getImageUrl(reference.imagePath)}
                      alt="레퍼런스"
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
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    {reference.baseProduct?.name || '기본형'}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {reference.description || '설명 없음'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

