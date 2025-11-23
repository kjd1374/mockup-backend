'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBaseProducts, createBaseProduct, updateBaseProduct, deleteBaseProduct, getImageUrl, type BaseProduct, type Part } from '@/lib/api';

export default function BaseProductsPage() {
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', constraints: '' });
  const [parts, setParts] = useState<Part[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getBaseProducts();
      setProducts(data);
    } catch (error) {
      console.error('기본형 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !imageFile) {
      alert('이미지를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('constraints', formData.constraints);
      formDataToSend.append('parts', JSON.stringify(parts));
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingId) {
        await updateBaseProduct(editingId, formDataToSend);
        alert('기본형이 수정되었습니다.');
      } else {
        await createBaseProduct(formDataToSend);
        alert('기본형이 등록되었습니다.');
      }
      
      await loadProducts();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', constraints: '' });
      setParts([]);
      setImageFile(null);
    } catch (error: any) {
      console.error('저장 실패:', error);
      alert(error.message || '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: BaseProduct) => {
    setEditingId(product.id);
    setFormData({ 
      name: product.name, 
      description: product.description,
      constraints: product.constraints || ''
    });
    setParts(product.parts ? JSON.parse(product.parts) : []);
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까? 관련된 레퍼런스와 시안도 함께 삭제됩니다.')) {
      return;
    }

    try {
      await deleteBaseProduct(id);
      await loadProducts();
      alert('기본형이 삭제되었습니다.');
    } catch (error: any) {
      console.error('삭제 실패:', error);
      alert(error.message || '삭제에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', constraints: '' });
    setParts([]);
    setImageFile(null);
  };

  const handleAddPart = () => {
    setParts([...parts, { partName: '', fullSize: '', printArea: '' }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: keyof Part, value: string) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {showForm ? '취소' : '+ 기본형 등록'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {showForm && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {editingId ? '기본형 수정' : '기본형 등록'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전제조건
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    (절대 바뀌면 안 되는 조건들을 입력하세요)
                  </span>
                </label>
                <textarea
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                  placeholder="예:&#10;- 아크릴 판의 두께는 3mm로 고정&#10;- 손잡이 위치는 하단 1/3 지점&#10;- 전체 높이는 200mm 이상 유지"
                />
                <p className="mt-1 text-xs text-gray-500">
                  시안 생성 시 이 조건들이 반드시 지켜집니다.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 {!editingId && '*'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editingId}
                />
                {editingId && (
                  <p className="mt-1 text-xs text-gray-500">이미지를 변경하지 않으려면 선택하지 않으세요.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    구분
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + 구분 추가
                  </button>
                </div>
                
                {parts.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center border border-gray-200 rounded-lg">
                    구분이 없습니다. "+ 구분 추가" 버튼을 클릭하여 추가하세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {parts.map((part, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">구분 {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(index)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              파트 이름 *
                            </label>
                            <input
                              type="text"
                              value={part.partName}
                              onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="예: 아크릴 판, 손잡이"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              전체 사이즈 *
                            </label>
                            <input
                              type="text"
                              value={part.fullSize}
                              onChange={(e) => handlePartChange(index, 'fullSize', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="예: 100mm x 200mm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              인쇄영역 사이즈 *
                            </label>
                            <input
                              type="text"
                              value={part.printArea}
                              onChange={(e) => handlePartChange(index, 'printArea', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="예: 80mm x 180mm"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {submitting ? (editingId ? '수정 중...' : '등록 중...') : (editingId ? '수정하기' : '등록하기')}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 기본형이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-100 relative" style={{ height: '120px' }}>
                  {product.imagePath ? (
                    <img
                      src={getImageUrl(product.imagePath)}
                      alt={product.name}
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
                      onLoad={() => {
                        // 이미지 로드 성공 시 로그 (디버깅용)
                        console.log('이미지 로드 성공:', getImageUrl(product.imagePath));
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
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="수정"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

