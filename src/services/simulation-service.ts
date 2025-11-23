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
    const fileData = await readFileBuffer(filePath);
    return fileData.toString('base64');
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
   * @param simulationType 시뮬레이션 타입 (1, 2, 3)
   */
  async generateSimulation(
    designImagePath: string,
    concept: string | null,
    simulationType: 1 | 2 | 3
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

      let prompt = '';

      switch (simulationType) {
        case 1:
          prompt = `다음 시안 이미지를 참고하여, 시안의 컨셉과 같은 스타일의 박스(포장 박스 또는 제품 박스)를 만들고 시안과 함께 배치한 이미지를 생성해주세요.

요구사항:
- 16:9 비율의 이미지로 생성
- 시안 이미지와 동일한 컨셉의 박스를 디자인하세요
- 박스와 시안이 함께 보이도록 자연스럽게 배치하세요
- ${concept ? `컨셉: ${concept} - 이 컨셉을 박스 디자인에도 반영하세요` : '시안의 디자인 스타일을 박스에도 적용하세요'}
- 고품질의 제품 사진 스타일로 생성
- 조명과 그림자를 자연스럽게 표현하세요`;
          break;

        case 2:
          prompt = `다음 시안 이미지를 참고하여, 콘서트 장에서 이 시안을 소중히 들고 있는 사람의 이미지를 생성해주세요.

요구사항:
- 16:9 비율의 이미지로 생성
- 콘서트장의 분위기(어두운 조명, 무대 조명 등)를 표현하세요
- 사람이 시안을 소중히 들고 있는 모습을 자연스럽게 표현하세요
- 시안이 조명에 비춰져 빛나는 모습을 표현하세요
- 감동적이고 따뜻한 분위기를 연출하세요
- 고품질의 사진 스타일로 생성`;
          break;

        case 3:
          prompt = `다음 시안 이미지를 참고하여, 콘서트 무대가 멀리서 작게 보이고 관객들이 모두 이 시안을 들고 가수를 응원하는 장면을 생성해주세요.

요구사항:
- 16:9 비율의 이미지로 생성
- 무대는 멀리서 작게 보이도록 구도를 잡으세요
- 관객석의 많은 사람들이 모두 같은 시안을 들고 있는 모습을 표현하세요
- 시안들이 조명에 비춰져 반짝이는 모습을 표현하세요
- 열정적이고 에너지 넘치는 콘서트 분위기를 연출하세요
- ${concept ? `컨셉: ${concept} - 이 컨셉의 느낌을 전체 장면에 반영하세요` : '시안의 디자인 스타일이 전체 장면에 일관되게 보이도록 하세요'}
- 고품질의 사진 스타일로 생성`;
          break;
      }

      // 프롬프트를 첫 번째로 추가
      parts.unshift(prompt);

      // Gemini API 호출
      console.log(`[시뮬레이션 ${simulationType}] Gemini API 호출 시작...`);
      const startTime = Date.now();
      
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      
      const apiTime = Date.now() - startTime;
      console.log(`[시뮬레이션 ${simulationType}] Gemini API 응답 받음 (${apiTime}ms)`);
      
      // 응답에서 이미지 데이터 확인
      const responseText = response.text();
      console.log(`[시뮬레이션 ${simulationType}] 응답 텍스트 길이:`, responseText.length);
      
      // 응답의 parts 확인 (이미지 데이터가 있을 수 있음)
      const responseParts = response.candidates?.[0]?.content?.parts || [];
      console.log(`[시뮬레이션 ${simulationType}] 응답 parts 개수:`, responseParts.length);
      
      // 이미지 데이터가 있는지 확인
      for (const part of responseParts) {
        if (part.inlineData) {
          console.log(`[시뮬레이션 ${simulationType}] 이미지 데이터 발견 (MIME: ${part.inlineData.mimeType}, 크기: ${part.inlineData.data.length} bytes)`);
          return {
            type: 'image',
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          };
        }
      }
      
      // 이미지가 없으면 텍스트 반환
      console.warn(`[시뮬레이션 ${simulationType}] 이미지 데이터를 찾을 수 없습니다. 텍스트 응답만 받았습니다.`);
      return {
        type: 'text',
        text: responseText,
      };
    } catch (error) {
      console.error(`시뮬레이션 ${simulationType} 생성 중 오류 발생:`, error);
      throw error;
    }
  }
}

