import multer from 'multer';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import path from 'path';

// 파일 필터: 이미지만 허용
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (JPEG, PNG, WEBP, GIF)'));
  }
};

// 메모리 스토리지 (버퍼로 저장)
const storage = multer.memoryStorage();

// Multer 설정
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 단일 파일 업로드
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// 여러 파일 업로드
export const uploadMultiple = (fieldName: string, maxCount: number = 10) =>
  upload.array(fieldName, maxCount);

// 필드별 여러 파일 업로드
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

