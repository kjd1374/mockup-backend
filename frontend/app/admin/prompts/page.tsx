'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSimulationPrompts, createSimulationPrompt, updateSimulationPrompt, deleteSimulationPrompt, type SimulationPrompt } from '@/lib/api';

export default function PromptsManagementPage() {
  const [prompts, setPrompts] = useState<SimulationPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SimulationPrompt | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await getSimulationPrompts();
      setPrompts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPrompt(null);
    setName('');
    setPromptText('');
    setIsDefault(false);
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: SimulationPrompt) => {
    setEditingPrompt(prompt);
    setName(prompt.name);
    setPromptText(prompt.prompt);
    setIsDefault(prompt.isDefault);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrompt) {
        await updateSimulationPrompt(editingPrompt.id, { name, prompt: promptText, isDefault });
        alert('수정되었습니다.');
      } else {
        await createSimulationPrompt({ name, prompt: promptText, isDefault });
        alert('생성되었습니다.');
      }
      closeModal();
      loadPrompts();
    } catch (err: any) {
      alert(err.message || '작업 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteSimulationPrompt(id);
      alert('삭제되었습니다.');
      loadPrompts();
    } catch (err: any) {
      alert(err.message || '삭제 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Link href="/designs" className="text-gray-500 hover:text-gray-700">
              ← 메인으로
            </Link>
            <h1 className="text-lg font-bold text-gray-900">시뮬레이션 조건 관리</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            새 조건 추가
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">로딩 중...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-lg shadow p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
                    {prompt.isDefault && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        기본 선택
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(prompt)}
                      className="text-gray-400 hover:text-purple-600"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded p-3 mb-4 text-sm text-gray-600 whitespace-pre-wrap h-32 overflow-y-auto">
                  {prompt.prompt}
                </div>
                <p className="text-xs text-gray-400 text-right">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingPrompt ? '조건 수정' : '새 조건 추가'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    조건 이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="예: 콘서트장 배경"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프롬프트 내용
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    * <code>{`{{concept}}`}</code>를 입력하면 시안의 컨셉 내용이 자동으로 들어갑니다.
                  </div>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none"
                    placeholder="AI에게 전달할 상세 프롬프트를 입력하세요..."
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                    기본 선택으로 설정
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

