import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 모델 정보 로드
export const modelInfo = JSON.parse(
  readFileSync(join(__dirname, '../../config/model-info.json'), 'utf-8')
);

// API 키 및 설정
export const config = {
  apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyAv5g9VVup8yqQtxA0-VFql1kEiIaBzsIM',
  modelName: process.env.MODEL_NAME || 'gemini-3-pro-preview',
  model: modelInfo.model,
};

