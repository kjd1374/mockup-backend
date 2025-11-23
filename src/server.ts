import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ensureUploadDirs } from './utils/file-utils.js';
import { initializeDatabase } from './utils/db-init.js';
import baseProductRoutes from './routes/base-product.routes.js';
import referenceRoutes from './routes/reference.routes.js';
import designRoutes from './routes/design.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 이미지)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 업로드 디렉토리 생성
ensureUploadDirs().catch(console.error);

// 데이터베이스 초기화 (서버 시작 시 자동 실행, 비동기로 실행하여 서버 시작을 막지 않음)
if (process.env.NODE_ENV === 'production') {
  // 비동기로 실행하여 서버 시작을 막지 않음
  setTimeout(() => {
    initializeDatabase().catch(console.error);
  }, 2000); // 2초 후 실행
}

// API 라우트
app.use('/api/base-products', baseProductRoutes);
app.use('/api/references', referenceRoutes);
app.use('/api/designs', designRoutes);

// Health check (Render sleep 방지용)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '서버가 정상적으로 실행 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// Keep-alive 엔드포인트 (외부에서 주기적으로 호출 가능)
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString()
  });
});

// 에러 핸들링 미들웨어
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('에러 발생:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '서버 오류가 발생했습니다.',
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api`);
  
  // 프로덕션 환경에서 데이터베이스 초기화 (서버 시작 후 실행)
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      initializeDatabase().catch(console.error);
    }, 2000);
  }
});

// 프로세스 종료 시 Prisma 연결 종료
process.on('SIGINT', async () => {
  process.exit(0);
});

process.on('SIGTERM', async () => {
  process.exit(0);
});

