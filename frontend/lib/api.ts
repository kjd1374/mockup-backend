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

export async function regenerateDesign(id: number): Promise<Design> {
  const res = await fetch(`${API_BASE_URL}/designs/${id}/regenerate`, {
    method: 'POST',
  });
  return handleApiResponse<Design>(res);
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
export function getImageUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }
  
  // 이미 전체 URL이면 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Cloudinary 경로인 경우
  if (path.startsWith('cloudinary:')) {
    const publicId = path.replace('cloudinary:', '');
    // Cloudinary CDN URL 생성 (cloud_name은 환경변수나 기본값 사용 필요하나, 여기서는 직접 URL 구조 생성)
    // 가장 간단한 방법: res.cloudinary.com/{cloud_name}/image/upload/{public_id}
    // 하지만 클라이언트에서 cloud_name을 알기 어려우므로, 서버에서 전체 URL을 내려주거나
    // 여기서는 임시로 서버의 프록시 URL이나 다른 방식을 고려해야 함.
    
    // 더 나은 방법: 백엔드에서 CloudinaryService를 통해 전체 URL을 반환하도록 변경하는 것이 좋음.
    // 하지만 당장 프론트엔드 수정을 위해서는, 
    // public_id가 아니라 전체 URL을 DB에 저장하거나,
    // path 자체가 http로 시작하는 전체 URL이라면 위에서 이미 리턴됨.
    
    // CloudinaryService.uploadFile에서 'cloudinary:' 접두어를 붙여서 리턴하고 있음.
    // 이를 해결하기 위해 서버 환경변수의 cloud_name이 필요함.
    
    // 임시 방편: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME 환경 변수 사용
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    }
    
    // 환경 변수가 없다면... 이미지 로드 불가. 
    // 서버에서 전체 URL을 저장하도록 변경하는 것이 가장 확실함.
    return ''; 
  }
  
  // Google Drive 경로인 경우
  if (path.startsWith('gdrive:')) {
    // gdrive:{folderName}/{fileId} 형식
    const parts = path.replace('gdrive:', '').split('/');
    const fileId = parts[parts.length - 1];
    // Google Drive 직접 링크로 변환
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  // API URL에서 /api 제거 (이미지는 /uploads로 직접 서빙됨)
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.replace('/api', '');
  }
  
  // baseUrl 끝의 슬래시 제거
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // path 앞의 슬래시 추가 (없으면)
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  const fullUrl = `${baseUrl}${cleanPath}`;
  return fullUrl;
}

