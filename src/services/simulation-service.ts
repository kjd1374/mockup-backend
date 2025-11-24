import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config.js';
import { readFileBuffer } from '../utils/file-utils.js';

export class SimulationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.modelName 
    });
  }

  /**
   * Buffer를 base64로 변환
   */
  private bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  /**
   * 이미지 파일을 base64로 변환
   */
  private async fileToBase64(filePath: string): Promise<string> {
    try {
      const fileData = await readFileBuffer(filePath);
      return fileData.toString('base64');
    } catch (error: any) {
      console.error(`[시뮬레이션] 이미지 읽기 실패 - 경로: ${filePath}`, error.message);
      throw new Error(`시안 이미지를 읽을 수 없습니다: ${filePath}. 파일이 존재하는지 확인해주세요. 원인: ${error.message}`);
    }
  }

  /**
   * 이미지 파일의 MIME 타입 추론
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }

  /**
   * 시뮬레이션 이미지 생성
   * @param designImagePath 생성된 시안 이미지 경로
   * @param concept 디자인 컨셉
   * @param promptText 시뮬레이션 프롬프트 텍스트
   * @param index 시뮬레이션 순서 (로그용)
   */
  async generateSimulation(
    designImagePath: string,
    concept: string | null,
    promptText: string,
    index: number
  ): Promise<{ type: 'image' | 'text'; data?: string; mimeType?: string; text?: string }> {
    try {
      const parts: any[] = [];
      
      // 시안 이미지 추가
      const designImageData = await this.fileToBase64(designImagePath);
      const designMimeType = this.getMimeType(designImagePath);
      
      parts.push({
        inlineData: {
          data: designImageData,
          mimeType: designMimeType,
        },
      });

      // 프롬프트 구성
      // {{concept}} 플레이스홀더가 있으면 교체, 없으면 뒤에 추가
      let finalPrompt = promptText;
      if (concept) {
        if (finalPrompt.includes('{{concept}}')) {
          finalPrompt = finalPrompt.replace('{{concept}}', concept);
        } else {
          finalPrompt += `\n\n(컨셉: ${concept})`;
        }
      } else {
        // 컨셉이 없으면 플레이스홀더 제거
        finalPrompt = finalPrompt.replace('{{concept}}', '');
      }

      // 기본 요구사항 추가 (이미지 품질 등)
      finalPrompt += `\n\n## 공통 요구사항:
- 16:9 비율의 이미지로 생성
- 고품질의 사진 스타일로 생성
- 조명과 그림자를 자연스럽게 표현하세요`;

      // 프롬프트를 첫 번째로 추가
      parts.unshift(finalPrompt);

      // Gemini API 호출
      console.log(`[시뮬레이션 ${index}] Gemini API 호출 시작...`);
      const startTime = Date.now();
      
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      
      const apiTime = Date.now() - startTime;
      console.log(`[시뮬레이션 ${index}] Gemini API 응답 받음 (${apiTime}ms)`);
      
      // 응답에서 이미지 데이터 확인
      const responseText = response.text();
      console.log(`[시뮬레이션 ${index}] 응답 텍스트 길이:`, responseText.length);
      
      // 응답의 parts 확인 (이미지 데이터가 있을 수 있음)
      const responseParts = response.candidates?.[0]?.content?.parts || [];
      console.log(`[시뮬레이션 ${index}] 응답 parts 개수:`, responseParts.length);
      
      // 이미지 데이터가 있는지 확인
      for (const part of responseParts) {
        if (part.inlineData) {
          console.log(`[시뮬레이션 ${index}] 이미지 데이터 발견 (MIME: ${part.inlineData.mimeType}, 크기: ${part.inlineData.data.length} bytes)`);
          return {
            type: 'image',
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          };
        }
      }
      
      // 이미지가 없으면 텍스트 반환
      console.warn(`[시뮬레이션 ${index}] 이미지 데이터를 찾을 수 없습니다. 텍스트 응답만 받았습니다.`);
      return {
        type: 'text',
        text: responseText,
      };
    } catch (error) {
      console.error(`시뮬레이션 ${index} 생성 중 오류 발생:`, error);
      throw error;
    }
  }
}

