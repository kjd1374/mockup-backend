import { GeminiService } from './gemini-service.js';

export interface RevisionRequest {
  imagePath: string;
  customerRequest: string;
  customerName?: string;
  projectName?: string;
}

export interface RevisionResult {
  success: boolean;
  result?: string;
  error?: string;
  timestamp: Date;
}

export class MockupRevisionService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * 고객사 요청에 맞춰 시안 수정
   */
  async processRevision(request: RevisionRequest): Promise<RevisionResult> {
    try {
      console.log(`[시안 수정 요청]`);
      if (request.customerName) {
        console.log(`고객사: ${request.customerName}`);
      }
      if (request.projectName) {
        console.log(`프로젝트: ${request.projectName}`);
      }
      console.log(`수정 요청: ${request.customerRequest}`);
      console.log(`이미지 경로: ${request.imagePath}`);

      const result = await this.geminiService.reviseMockup(
        request.imagePath,
        request.customerRequest
      );

      return {
        success: true,
        result: result,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('시안 수정 처리 중 오류:', error);
      return {
        success: false,
        error: error.message || '알 수 없는 오류가 발생했습니다.',
        timestamp: new Date(),
      };
    }
  }

  /**
   * 모델 정보 조회
   */
  getModelInfo() {
    return this.geminiService.getModelInfo();
  }
}

