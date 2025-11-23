const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// API 응답 처리 헬퍼 함수
async function handleApiResponse<T>(response: Response): Promise<T> {
  // 응답 텍스트로 먼저 읽기 (한 번만 읽을 수 있음)
  const text = await response.text();
  
  // Content-Type 확인
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`서버가 HTML을 반환했습니다. API URL을 확인해주세요. (${response.status})`);
    }
    throw new Error(`서버 응답 오류: ${text.substring(0, 100)} (${response.status})`);
  }

  // JSON 파싱
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON 파싱 오류: ${text.substring(0, 100)}`);
  }

  // 상태 코드 확인
  if (!response.ok) {
    throw new Error(data.error || `서버 오류: ${response.status} ${response.statusText}`);
  }

  // success 확인
  if (!data.success) {
    throw new Error(data.error || '요청 처리에 실패했습니다.');
  }
  
  return data.data;
}

export interface Part {
  partName: string;
  fullSize: string;
  printArea: string;
}

export interface BaseProduct {
  id: number;
  name: string;
  description: string;
  imagePath: string;
  parts: string | null; // JSON 문자열
  constraints: string | null; // 전제조건
  createdAt: string;
}

export interface Reference {
  id: number;
  baseProductId: number;
  imagePath: string;
  description: string | null;
  createdAt: string;
  baseProduct?: {
    id: number;
    name: string;
  };
}

export interface Design {
  id: number;
  baseProductId: number;
  logoPath: string | null;
  userImages: string;
  text: string | null;
  concept: string | null;
  generatedImagePath: string | null;
  simulationImages: string | null;
  simulationStatus: 'idle' | 'generating' | 'completed' | 'failed' | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  baseProduct?: {
    id: number;
    name: string;
  };
}

// 기본형 API
export async function getBaseProducts(): Promise<BaseProduct[]> {
  const res = await fetch(`${API_BASE_URL}/base-products`);
  return handleApiResponse<BaseProduct[]>(res);
}

export async function getBaseProduct(id: number): Promise<BaseProduct> {
  const res = await fetch(`${API_BASE_URL}/base-products/${id}`);
  return handleApiResponse<BaseProduct>(res);
}

export async function createBaseProduct(formData: FormData): Promise<BaseProduct> {
  const res = await fetch(`${API_BASE_URL}/base-products`, {
    method: 'POST',
    body: formData,
  });
  return handleApiResponse<BaseProduct>(res);
}

export async function updateBaseProduct(id: number, formData: FormData): Promise<BaseProduct> {
  const res = await fetch(`${API_BASE_URL}/base-products/${id}`, {
    method: 'PUT',
    body: formData,
  });
  return handleApiResponse<BaseProduct>(res);
}

export async function deleteBaseProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/base-products/${id}`, {
    method: 'DELETE',
  });
  await handleApiResponse<void>(res);
}

// 레퍼런스 API
export async function getReferences(baseProductId?: number): Promise<Reference[]> {
  const url = baseProductId
    ? `${API_BASE_URL}/references?baseProductId=${baseProductId}`
    : `${API_BASE_URL}/references`;
  const res = await fetch(url);
  return handleApiResponse<Reference[]>(res);
}

export async function createReference(formData: FormData): Promise<Reference> {
  const res = await fetch(`${API_BASE_URL}/references`, {
    method: 'POST',
    body: formData,
  });
  return handleApiResponse<Reference>(res);
}

// 시안 API
export async function getDesigns(baseProductId?: number): Promise<Design[]> {
  const url = baseProductId
    ? `${API_BASE_URL}/designs?baseProductId=${baseProductId}`
    : `${API_BASE_URL}/designs`;
  const res = await fetch(url);
  return handleApiResponse<Design[]>(res);
}

export async function getDesign(id: number): Promise<Design> {
  const res = await fetch(`${API_BASE_URL}/designs/${id}`);
  return handleApiResponse<Design>(res);
}

export async function createDesign(formData: FormData): Promise<Design> {
  const res = await fetch(`${API_BASE_URL}/designs`, {
    method: 'POST',
    body: formData,
  });
  return handleApiResponse<Design>(res);
}

export async function deleteDesign(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/designs/${id}`, {
    method: 'DELETE',
  });
  await handleApiResponse<void>(res);
}

export async function generateSimulation(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/designs/${id}/simulation`, {
    method: 'POST',
  });
  
  // generateSimulation은 직접 { success, message } 형식으로 반환
  const text = await res.text();
  const contentType = res.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`서버가 HTML을 반환했습니다. API URL을 확인해주세요. (${res.status})`);
    }
    throw new Error(`서버 응답 오류: ${text.substring(0, 100)} (${res.status})`);
  }
  
  const data = JSON.parse(text);
  if (!data.success) {
    throw new Error(data.error || '시뮬레이션 생성에 실패했습니다.');
  }
  
  return data;
}

// 이미지 URL 변환
export function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}/${path}`;
}

