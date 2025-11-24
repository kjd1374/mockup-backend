'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getDesign, generateSimulation, regenerateDesign, modifyDesign, getImageUrl, getSimulationPrompts, type Design, type SimulationPrompt } from '@/lib/api';

export default function DesignDetailPage() {
  const params = useParams();
  const designId = parseInt(params.id as string);
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [modificationText, setModificationText] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  // Simulation Modal State
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [prompts, setPrompts] = useState<SimulationPrompt[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<number[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  useEffect(() => {
    if (designId) {
      loadDesign();
      // pending 또는 generating 상태면 3초마다 업데이트
      const interval = setInterval(() => {
        loadDesign(); // 항상 업데이트하여 상태 확인
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [designId]);

  const loadDesign = async () => {
    try {
      setLoading(true);
      const data = await getDesign(designId);
      setDesign(data);
    } catch (error) {
      console.error('시안 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSimModal = async () => {
    setIsSimModalOpen(true);
    setIsLoadingPrompts(true);
    try {
      const data = await getSimulationPrompts();
      setPrompts(data);
      // 기본 선택값 설정 (isDefault가 true인 것들, 최대 3개)
      const defaults = data.filter(p => p.isDefault).slice(0, 3).map(p => p.id);
      setSelectedPromptIds(defaults);
    } catch (error) {
      console.error('프롬프트 로드 실패:', error);
      alert('시뮬레이션 조건 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const togglePromptSelection = (id: number) => {
    setSelectedPromptIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        if (prev.length >= 3) {
          alert('최대 3개까지만 선택할 수 있습니다.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleGenerateSimulation = async () => {
    if (selectedPromptIds.length === 0) {
      alert('최소 1개의 조건을 선택해주세요.');
      return;
    }

    try {
      await generateSimulation(designId, selectedPromptIds);
      setIsSimModalOpen(false);
      alert('시뮬레이션 생성이 시작되었습니다. 잠시만 기다려주세요.');
      // 상태 업데이트를 위해 즉시 다시 로드
      await loadDesign();
    } catch (error: any) {
      console.error('시뮬레이션 생성 실패:', error);
      alert(error.message || '시뮬레이션 생성에 실패했습니다.');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('동일한 조건으로 새로운 시안을 생성하시겠습니까?')) {
      return;
    }

    try {
      const newDesign = await regenerateDesign(designId);
      alert('시안 재생성이 시작되었습니다. 잠시만 기다려주세요.');
      // 새 시안 페이지로 이동
      window.location.href = `/designs/${newDesign.id}`;
    } catch (error: any) {
      console.error('시안 재생성 실패:', error);
      alert(error.message || '시안 재생성에 실패했습니다.');
    }
  };

  const handleModify = async () => {
    if (!modificationText.trim()) {
      alert('수정 내용을 입력해주세요.');
      return;
    }

    if (!confirm('입력하신 내용으로 시안을 수정하시겠습니까?')) {
      return;
    }

    try {
      setIsModifying(true);
      const newDesign = await modifyDesign(designId, modificationText);
      alert('시안 수정이 시작되었습니다. 잠시만 기다려주세요.');
      // 새 시안 페이지로 이동
      window.location.href = `/designs/${newDesign.id}`;
    } catch (error: any) {
      console.error('시안 수정 실패:', error);
      alert(error.message || '시안 수정에 실패했습니다.');
      setIsModifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-4 py-2 text-sm font-medium rounded-full bg-green-100 text-green-800">
            완료
          </span>
        );
      case 'pending':
        return (
          <span className="px-4 py-2 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
            생성 중...
          </span>
        );
      case 'failed':
        return (
          <span className="px-4 py-2 text-sm font-medium rounded-full bg-red-100 text-red-800">
            생성 실패
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && !design) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">시안을 찾을 수 없습니다.</p>
          <Link
            href="/designs"
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const userImages = design.userImages ? JSON.parse(design.userImages) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/designs" className="text-xl font-semibold text-gray-900">
            ← 시안 목록
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold text-gray-900">
              {design.baseProduct?.name || '시안'} 상세
            </h1>
            {getStatusBadge(design.status)}
          </div>
          <p className="text-gray-600">
            생성일: {new Date(design.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>

        <div className="space-y-6">
          {/* 생성된 시안 이미지 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">생성된 시안</h2>
            {design.generatedImagePath ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(design.generatedImagePath)}
                    alt="생성된 시안"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <a
                    href={getImageUrl(design.generatedImagePath)}
                    download
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    이미지 다운로드
                  </a>
                  <button
                    onClick={() => {
                      const img = new Image();
                      img.src = getImageUrl(design.generatedImagePath!);
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<img src="${img.src}" style="max-width: 100%; height: auto;" />`);
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    새 창에서 보기
                  </button>
                  {design.status === 'completed' && (
                    <>
                      <button
                        onClick={handleRegenerate}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        재생성
                      </button>
                      <button
                        onClick={handleOpenSimModal}
                        disabled={design.simulationStatus === 'generating'}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {design.simulationStatus === 'generating' ? '시뮬레이션 생성 중...' : '시뮬레이션 생성'}
                      </button>
                      <Link
                        href="/admin/prompts"
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        조건 관리
                      </Link>
                    </>
                  )}
                </div>

                {/* 시안 수정 영역 */}
                {design.status === 'completed' && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-gray-900 mb-2">시안 수정하기</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      현재 시안을 바탕으로 수정하고 싶은 내용을 입력하세요. (예: 손잡이 색상을 파란색으로 변경해줘)
                    </p>
                    <div className="space-y-3">
                      <textarea
                        value={modificationText}
                        onChange={(e) => setModificationText(e.target.value)}
                        placeholder="수정 요청사항을 입력하세요..."
                        className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleModify}
                          disabled={isModifying || !modificationText.trim()}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isModifying ? '수정 요청 중...' : '수정 요청하기'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : design.status === 'pending' ? (
              <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">시안을 생성하고 있습니다. 잠시만 기다려주세요...</p>
                </div>
              </div>
            ) : design.status === 'failed' ? (
              <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-800 font-medium mb-2">시안 생성에 실패했습니다.</p>
                  <p className="text-red-600 text-sm mb-4">
                    자세한 오류 내용은 Render 대시보드의 로그에서 확인할 수 있습니다.
                  </p>
                  <div className="bg-white rounded-lg p-4 text-left text-sm text-gray-700">
                    <p className="font-medium mb-2">로그 확인 방법:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Render 대시보드 접속</li>
                      <li>서비스 선택 → "Logs" 탭 클릭</li>
                      <li>"[시안 생성]"으로 시작하는 로그 확인</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">생성된 이미지가 없습니다.</p>
              </div>
            )}
          </div>

          {/* 시뮬레이션 이미지들 */}
          {design.simulationStatus && design.simulationStatus !== 'idle' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">시뮬레이션</h2>
              {design.simulationStatus === 'generating' ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">시뮬레이션 이미지를 생성하고 있습니다. 잠시만 기다려주세요...</p>
                </div>
              ) : design.simulationStatus === 'completed' && design.simulationImages ? (
                <div className="space-y-6">
                  {JSON.parse(design.simulationImages).map((imagePath: string, index: number) => {
                    const titles = [
                      '시안과 컨셉 박스',
                      '콘서트장에서 시안을 들고 있는 모습',
                      '콘서트 무대와 관객들이 시안을 들고 응원하는 장면',
                    ];
                    return (
                      <div key={index} className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700">{titles[index]}</h3>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(imagePath)}
                            alt={titles[index]}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={getImageUrl(imagePath)}
                            download
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                          >
                            다운로드
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  ) : design.simulationStatus === 'failed' ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">시뮬레이션 생성에 실패했습니다.</p>
                  <button
                    onClick={handleOpenSimModal}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    다시 시도
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* 컨셉 */}
          {design.concept && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">디자인 컨셉</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{design.concept}</p>
            </div>
          )}

          {/* 텍스트 요청사항 */}
          {design.text && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">텍스트 요청사항</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{design.text}</p>
            </div>
          )}

          {/* 업로드된 로고 */}
          {design.logoPath && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">업로드된 로고</h2>
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(design.logoPath)}
                  alt="로고"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* 업로드된 이미지들 */}
          {userImages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">업로드된 이미지</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userImages.map((imagePath: string, index: number) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(imagePath)}
                      alt={`이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Simulation Modal */}
      {isSimModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">시뮬레이션 조건 선택</h2>
              <p className="text-gray-600 mb-6">
                원하는 시뮬레이션 조건을 선택해주세요. (최대 3개)
              </p>

              {isLoadingPrompts ? (
                <div className="text-center py-8">로딩 중...</div>
              ) : prompts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  등록된 조건이 없습니다. <br />
                  <Link href="/admin/prompts" className="text-purple-600 underline">
                    조건 관리 페이지
                  </Link>
                  에서 조건을 추가해주세요.
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPromptIds.includes(prompt.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => togglePromptSelection(prompt.id)}
                    >
                      <div className="flex items-center h-5 mt-0.5">
                        <input
                          type="checkbox"
                          checked={selectedPromptIds.includes(prompt.id)}
                          onChange={() => {}} // handled by parent div click
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label className="font-medium text-gray-900 cursor-pointer">
                          {prompt.name}
                        </label>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {prompt.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsSimModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleGenerateSimulation}
                  disabled={selectedPromptIds.length === 0 || isLoadingPrompts}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  생성하기 ({selectedPromptIds.length}/3)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

