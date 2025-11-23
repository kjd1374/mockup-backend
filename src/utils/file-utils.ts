import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path, { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { GoogleDriveService } from '../services/google-drive.service.js';
import { CloudinaryService } from '../services/cloudinary.service.js';

// 프로젝트 루트 경로 (dist 폴더 기준으로 상위 디렉토리)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// 서비스 인스턴스 (싱글톤)
let googleDriveService: GoogleDriveService | null = null;
let cloudinaryService: CloudinaryService | null = null;

/**
 * Google Drive 서비스 가져오기
 */
function getGoogleDriveService(): GoogleDriveService {
  if (!googleDriveService) {
    googleDriveService = new GoogleDriveService();
  }
  return googleDriveService;
}

/**
 * Cloudinary 서비스 가져오기
 */
function getCloudinaryService(): CloudinaryService {
  if (!cloudinaryService) {
    cloudinaryService = new CloudinaryService();
  }
  return cloudinaryService;
}

/**
 * 스토리지 서비스 사용 여부 확인
 */
async function useExternalStorage(): Promise<'google-drive' | 'cloudinary' | null> {
  // Cloudinary 우선 확인
  if (process.env.USE_CLOUDINARY === 'true') {
    const service = getCloudinaryService();
    if (service.isAvailable()) {
      return 'cloudinary';
    }
  }

  // Google Drive 확인
  if (process.env.USE_GOOGLE_DRIVE === 'true') {
    const service = getGoogleDriveService();
    if (await service.isAvailable()) {
      return 'google-drive';
    }
  }
  
  return null;
}

export const UPLOAD_DIRS = {
  BASE_PRODUCTS: 'uploads/base-products',
  REFERENCES: 'uploads/references',
  LOGOS: 'uploads/logos',
  USER_IMAGES: 'uploads/user-images',
  GENERATED: 'uploads/generated',
} as const;

/**
 * 업로드 디렉토리 생성
 */
export async function ensureUploadDirs() {
  for (const dir of Object.values(UPLOAD_DIRS)) {
    const absoluteDir = resolve(PROJECT_ROOT, dir);
    if (!existsSync(absoluteDir)) {
      await mkdir(absoluteDir, { recursive: true });
      console.log(`[디렉토리 생성] ${absoluteDir}`);
    }
  }
}

/**
 * 파일 저장
 */
export async function saveFile(
  buffer: Buffer,
  dir: string,
  originalName: string
): Promise<string> {
  const storageType = await useExternalStorage();
  const ext = originalName.split('.').pop() || 'png';
  const filename = `${randomUUID()}.${ext}`;
  const mimeType = getMimeType(ext);

  // Cloudinary 사용
  if (storageType === 'cloudinary') {
    const cloudinary = getCloudinaryService();
    const folderName = dir.replace('uploads/', '').replace(/\//g, '-');
    return await cloudinary.uploadFile(buffer, folderName, filename, mimeType);
  }

  // Google Drive 사용
  if (storageType === 'google-drive') {
    const driveService = getGoogleDriveService();
    const folderName = dir.replace('uploads/', '').replace(/\//g, '-');
    return await driveService.uploadFile(buffer, folderName, filename, mimeType);
  }

  // 로컬 파일 시스템 사용
  await ensureUploadDirs();
  
  // 절대 경로로 변환
  const absoluteDir = resolve(PROJECT_ROOT, dir);
  const absoluteFilePath = join(absoluteDir, filename);
  
  await writeFile(absoluteFilePath, buffer);
  
  // Windows 경로 구분자를 웹 URL 형식으로 변환 (상대 경로 반환)
  const webPath = join(dir, filename).replace(/\\/g, '/');
  
  // 파일이 실제로 저장되었는지 확인
  if (!existsSync(absoluteFilePath)) {
    throw new Error(`파일 저장 실패: ${absoluteFilePath}`);
  }
  
  console.log(`[파일 저장] 성공: ${webPath} (절대 경로: ${absoluteFilePath}, 크기: ${buffer.length} bytes)`);
  return webPath;
}

/**
 * MIME 타입 가져오기
 */
function getMimeType(ext: string): string {
  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return mimeTypes[ext.toLowerCase()] || 'image/png';
}

/**
 * 상대 경로를 절대 경로로 변환
 */
export function resolveFilePath(filepath: string): string {
  // 이미 절대 경로인 경우 그대로 반환
  if (path.isAbsolute(filepath)) {
    return filepath;
  }
  
  // 상대 경로인 경우 프로젝트 루트 기준으로 변환
  return resolve(PROJECT_ROOT, filepath);
}

/**
 * 파일 존재 여부 확인
 */
export async function fileExists(filepath: string): Promise<boolean> {
  // Cloudinary 경로인지 확인
  if (filepath.startsWith('cloudinary:')) {
    const cloudinary = getCloudinaryService();
    return await cloudinary.fileExists(filepath);
  }

  // Google Drive 경로인지 확인
  if (filepath.startsWith('gdrive:')) {
    const driveService = getGoogleDriveService();
    return await driveService.fileExists(filepath);
  }

  // 로컬 파일 시스템 사용
  const absolutePath = resolveFilePath(filepath);
  return existsSync(absolutePath);
}

/**
 * 파일 읽기
 */
export async function readFileBuffer(filepath: string): Promise<Buffer> {
  // Cloudinary 경로인지 확인
  if (filepath.startsWith('cloudinary:')) {
    const cloudinary = getCloudinaryService();
    return await cloudinary.downloadFile(filepath);
  }

  // Google Drive 경로인지 확인
  if (filepath.startsWith('gdrive:')) {
    const driveService = getGoogleDriveService();
    return await driveService.downloadFile(filepath);
  }

  // 로컬 파일 시스템 사용
  // 상대 경로를 절대 경로로 변환
  const absolutePath = resolveFilePath(filepath);
  
  // 파일 존재 여부 확인
  if (!existsSync(absolutePath)) {
    // 원본 경로와 절대 경로 모두 로그에 기록
    console.error(`[파일 읽기 실패] 원본 경로: ${filepath}`);
    console.error(`[파일 읽기 실패] 절대 경로: ${absolutePath}`);
    console.error(`[파일 읽기 실패] 프로젝트 루트: ${PROJECT_ROOT}`);
    throw new Error(`파일을 찾을 수 없습니다: ${filepath} (절대 경로: ${absolutePath})`);
  }
  
  return await readFile(absolutePath);
}

/**
 * 파일 경로에서 파일명 추출
 */
export function getFilename(filepath: string): string {
  return filepath.split('/').pop() || filepath.split('\\').pop() || '';
}

