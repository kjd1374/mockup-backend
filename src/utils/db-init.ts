import { execSync } from 'child_process';

/**
 * 서버 시작 시 데이터베이스 스키마를 자동으로 초기화
 * Render 무료 플랜에서 Shell 접근이 제한되므로 자동화
 */
export async function initializeDatabase() {
  try {
    console.log('📊 데이터베이스 스키마 초기화 중...');
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('✅ 데이터베이스 스키마 초기화 완료');
  } catch (error) {
    console.warn('⚠️ 데이터베이스 스키마 초기화 실패 (이미 존재할 수 있음):', error);
    // 실패해도 서버는 계속 실행
  }
}

