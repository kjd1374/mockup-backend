'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBaseProducts, getReferences, createDesign, getImageUrl, type BaseProduct, type Reference } from '@/lib/api';

export default function CreateDesignPage() {
  const [baseProducts, setBaseProducts] = useState<BaseProduct[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    baseProductId: '',
    referenceIds: [] as number[],
    concept: '',
    text: '',
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [userImageFiles, setUserImageFiles] = useState<File[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.baseProductId) {
      loadReferences(parseInt(formData.baseProductId));
    }
  }, [formData.baseProductId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const products = await getBaseProducts();
      setBaseProducts(products);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async (baseProductId: number) => {
    try {
      const refs = await getReferences(baseProductId);
      setReferences(refs);
    } catch (error) {
      console.error('레퍼런스 로드 실패:', error);
    }
  };

  const handleReferenceToggle = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      referenceIds: prev.referenceIds.includes(id)
        ? prev.referenceIds.filter((refId) => refId !== id)
        : [...prev.referenceIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.baseProductId) {
      alert('기본형을 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('baseProductId', formData.baseProductId);
      formDataToSend.append('referenceIds', JSON.stringify(formData.referenceIds));
      formDataToSend.append('concept', formData.concept);
      formDataToSend.append('text', formData.text);
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }
      
      userImageFiles.forEach((file) => {
        formDataToSend.append('userImages', file);
      });

      const design = await createDesign(formDataToSend);
      // 시안 상세 페이지로 이동
      window.location.href = `/designs/${design.id}`;
    } catch (error) {
      console.error('시안 생성 실패:', error);
      alert('시안 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            ← 시안 생성
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">시안 생성</h1>
          <p className="text-gray-600">기본형과 레퍼런스를 선택하고 디자인 요소를 추가하세요.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본형 선택 *
                  </label>
                  <select
                    value={formData.baseProductId}
                    onChange={(e) => setFormData({ ...formData, baseProductId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                {references.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      레퍼런스 선택 (여러 개 선택 가능)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {references.map((ref) => (
                        <label
                          key={ref.id}
                          className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                            formData.referenceIds.includes(ref.id)
                              ? 'border-purple-500 ring-2 ring-purple-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.referenceIds.includes(ref.id)}
                            onChange={() => handleReferenceToggle(ref.id)}
                            className="sr-only"
                          />
                          <div className="aspect-video bg-gray-100">
                            <img
                              src={getImageUrl(ref.imagePath)}
                              alt="레퍼런스"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {formData.referenceIds.includes(ref.id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">디자인 요소</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    컨셉 *
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (디자인 컨셉을 자연어로 입력하세요)
                    </span>
                  </label>
                  <textarea
                    value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="예: '미니멀하고 세련된 느낌의 디자인. 깔끔한 라인과 부드러운 그라데이션을 사용하여 고급스러운 분위기를 연출하세요.'"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    컨셉은 시안의 전체적인 디자인 방향을 결정합니다. 로고와 텍스트가 이 컨셉에 맞게 통합됩니다.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    로고 (선택)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 이미지 (선택, 여러 개 가능)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setUserImageFiles(Array.from(e.target.files || []))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    텍스트 요청사항 (선택)
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="예: '로고는 왼쪽 상단에 배치하고, 배경은 흰색으로 해주세요'"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg disabled:opacity-50"
            >
              {submitting ? '시안 생성 중...' : '시안 생성하기'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

