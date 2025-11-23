import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

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
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
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
  await ensureUploadDirs();
  
  const ext = originalName.split('.').pop() || 'png';
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(dir, filename);
  
  await writeFile(filepath, buffer);
  
  // Windows 경로 구분자를 웹 URL 형식으로 변환
  const webPath = filepath.replace(/\\/g, '/');
  
  // 파일이 실제로 저장되었는지 확인
  if (!existsSync(filepath)) {
    throw new Error(`파일 저장 실패: ${filepath}`);
  }
  
  console.log(`[파일 저장] 성공: ${webPath} (크기: ${buffer.length} bytes)`);
  return webPath;
}

/**
 * 파일 읽기
 */
export async function readFileBuffer(filepath: string): Promise<Buffer> {
  // 파일 존재 여부 확인
  if (!existsSync(filepath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${filepath}`);
  }
  return await readFile(filepath);
}

/**
 * 파일 경로에서 파일명 추출
 */
export function getFilename(filepath: string): string {
  return filepath.split('/').pop() || filepath.split('\\').pop() || '';
}

