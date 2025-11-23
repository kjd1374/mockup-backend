import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ensureUploadDirs } from './utils/file-utils.js';
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api`);
});

