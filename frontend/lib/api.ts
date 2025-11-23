const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function getBaseProduct(id: number): Promise<BaseProduct> {
  const res = await fetch(`${API_BASE_URL}/base-products/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createBaseProduct(formData: FormData): Promise<BaseProduct> {
  const res = await fetch(`${API_BASE_URL}/base-products`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateBaseProduct(id: number, formData: FormData): Promise<BaseProduct> {
  const res = await fetch(`${API_BASE_URL}/base-products/${id}`, {
    method: 'PUT',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteBaseProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/base-products/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

// 레퍼런스 API
export async function getReferences(baseProductId?: number): Promise<Reference[]> {
  const url = baseProductId
    ? `${API_BASE_URL}/references?baseProductId=${baseProductId}`
    : `${API_BASE_URL}/references`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createReference(formData: FormData): Promise<Reference> {
  const res = await fetch(`${API_BASE_URL}/references`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

// 시안 API
export async function getDesigns(baseProductId?: number): Promise<Design[]> {
  const url = baseProductId
    ? `${API_BASE_URL}/designs?baseProductId=${baseProductId}`
    : `${API_BASE_URL}/designs`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function getDesign(id: number): Promise<Design> {
  const res = await fetch(`${API_BASE_URL}/designs/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createDesign(formData: FormData): Promise<Design> {
  const res = await fetch(`${API_BASE_URL}/designs`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteDesign(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/designs/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

export async function generateSimulation(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/designs/${id}/simulation`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

// 이미지 URL 변환
export function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}/${path}`;
}

