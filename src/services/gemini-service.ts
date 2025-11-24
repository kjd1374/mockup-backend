import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config.js';
import { readFileBuffer } from '../utils/file-utils.js';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.modelName 
    });
  }

  /**
   * 이미지 파일을 base64로 변환
   */
  private async fileToBase64(filePath: string): Promise<string> {
    try {
      const fileData = await readFileBuffer(filePath);
      return fileData.toString('base64');
    } catch (error: any) {
      console.error(`[이미지 읽기 실패] 경로: ${filePath}`, error.message);
      throw new Error(`이미지 파일을 읽을 수 없습니다: ${filePath}. 파일이 존재하는지 확인해주세요. 원인: ${error.message}`);
    }
  }

  /**
   * Buffer를 base64로 변환
   */
  private bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
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
   * Buffer에서 MIME 타입 추론
   */
  private getMimeTypeFromBuffer(buffer: Buffer, originalName: string): string {
    return this.getMimeType(originalName);
  }

  /**
   * 시안 생성: 기본형, 레퍼런스, 로고, 이미지, 텍스트를 조합하여 시안 생성
   */
  async generateDesign(params: {
    baseProductImagePath: string;
    referenceImagePaths: string[];
    logoBuffer?: Buffer;
    logoMimeType?: string;
    userImageBuffers?: Buffer[];
    userImageMimeTypes?: string[];
    text?: string;
    concept?: string;
    constraints?: string | null;
  }): Promise<{ type: 'image' | 'text'; data?: string; mimeType?: string; text?: string }> {
    try {
      const parts: any[] = [];
      
      // 프롬프트 구성
      let prompt = `당신은 전문 제품 디자이너입니다. 다음 정보를 바탕으로 아크릴 응원봉 시안을 정확하고 상세하게 생성해주세요.

## 제품 구조 분석 및 디자인 요구사항:

1. **기본형 제품 이미지 분석:**
   - 기본형 이미지를 자세히 분석하여 제품의 정확한 구조를 파악하세요.
   - 아크릴 판 부분과 손잡이 부분을 명확히 구분하여 인식하세요.
   - 각 부분의 형태, 크기, 비율, 위치 관계를 정확히 파악하세요.
   - 아크릴 판의 두께, 모서리 처리, 전체적인 형태를 분석하세요.
   - 손잡이의 위치, 길이, 형태, 아크릴 판과의 연결 방식을 분석하세요.

2. **레퍼런스 이미지 분석:**
   - 레퍼런스 이미지들을 참고하여 실제 제작된 제품의 디자인 스타일을 이해하세요.
   - 레퍼런스의 색상, 패턴, 그래픽 요소, 텍스트 배치 방식을 참고하세요.
   - 단, 제품의 기본 구조(아크릴 판과 손잡이의 형태 및 위치)는 기본형 이미지를 정확히 따르세요.

3. **구조적 정확성:**
   - 아크릴 판과 손잡이는 명확히 구분되어야 합니다.
   - 아크릴 판은 투명하거나 반투명한 재질감을 표현하세요.
   - 손잡이는 아크릴 판과 다른 재질감(플라스틱, 고무 등)으로 표현하세요.
   - 두 부분의 경계가 명확하게 보이도록 하세요.
   - 기본형 이미지의 구조를 정확히 유지하면서 디자인만 적용하세요.

`;

      // 기본형 이미지 추가
      const baseImageData = await this.fileToBase64(params.baseProductImagePath);
      const baseMimeType = this.getMimeType(params.baseProductImagePath);
      
      parts.push({
        inlineData: {
          data: baseImageData,
          mimeType: baseMimeType,
        },
      });
      
      prompt += `\n## 제공된 이미지 자료:

**기본형 제품 이미지 (구조 참고용):**
- 이 이미지의 제품 구조를 정확히 분석하세요.
- 아크릴 판과 손잡이의 형태, 크기, 위치를 정확히 파악하세요.
- 생성된 시안은 이 구조를 정확히 따라야 합니다.`;

      // 레퍼런스 이미지들 추가
      if (params.referenceImagePaths.length > 0) {
        prompt += `\n\n**레퍼런스 이미지들 (디자인 스타일 참고용):`;
        for (let i = 0; i < params.referenceImagePaths.length; i++) {
          const refPath = params.referenceImagePaths[i];
          const refImageData = await this.fileToBase64(refPath);
          const refMimeType = this.getMimeType(refPath);
          
          parts.push({
            inlineData: {
              data: refImageData,
              mimeType: refMimeType,
            },
          });
          prompt += `\n- 레퍼런스 ${i + 1}: 실제 제작된 제품의 디자인 스타일을 참고하세요.`;
        }
        prompt += `\n- 레퍼런스의 디자인 요소(색상, 패턴, 그래픽)는 참고하되, 제품 구조는 기본형을 따르세요.`;
      }

      // 로고 추가
      if (params.logoBuffer) {
        const logoData = this.bufferToBase64(params.logoBuffer);
        const logoMime = params.logoMimeType || 'image/png';
        
        parts.push({
          inlineData: {
            data: logoData,
            mimeType: logoMime,
          },
        });
        
        prompt += `\n\n**로고 이미지:**
- 제공된 로고를 시안에 적절하게 배치하세요.
- 로고의 크기와 위치는 제품의 구조를 고려하여 자연스럽게 배치하세요.`;
      }

      // 사용자 이미지들 추가
      if (params.userImageBuffers && params.userImageBuffers.length > 0) {
        prompt += `\n\n**추가 디자인 이미지들:`;
        for (let i = 0; i < params.userImageBuffers.length; i++) {
          const imgData = this.bufferToBase64(params.userImageBuffers[i]);
          const imgMime = params.userImageMimeTypes?.[i] || 'image/png';
          
          parts.push({
            inlineData: {
              data: imgData,
              mimeType: imgMime,
            },
          });
          prompt += `\n- 추가 이미지 ${i + 1}: 이 이미지의 디자인 요소를 시안에 반영하세요.`;
        }
      }

      // 전제조건 추가 (기본형의 절대 바뀌면 안 되는 조건)
      if (params.constraints) {
        prompt += `\n\n## 전제조건 (절대 변경 불가):\n${params.constraints}\n\n위 전제조건들은 반드시 지켜야 하며, 어떤 경우에도 변경하거나 위반해서는 안 됩니다.`;
      }

      // 컨셉 추가
      if (params.concept) {
        prompt += `\n\n## 디자인 컨셉:\n${params.concept}\n\n이 컨셉을 중심으로 디자인을 구성하세요. 컨셉의 느낌, 분위기, 스타일을 시안에 반영하세요.`;
      }

      // 텍스트 요청사항 추가
      if (params.text) {
        prompt += `\n\n## 추가 텍스트 요청사항:\n${params.text}`;
      }

      prompt += `\n\n## 최종 시안 생성 지침:

이 시안은 **제안용 시안**입니다. 고객에게 제품 제작을 제안하기 위한 목적으로, 모든 요소를 종합적으로 분석하여 최적의 디자인을 만들어야 합니다.

1. **구조 정확성 (최우선):**
   - 기본형 이미지의 제품 구조(아크릴 판과 손잡이의 형태, 크기, 위치)를 정확히 유지하세요.
   - 아크릴 판과 손잡이는 명확히 구분되어 보여야 합니다.
   - 두 부분의 재질감이 다르게 표현되어야 합니다.
   - 전제조건에 명시된 모든 조건을 반드시 준수하세요.

2. **컨셉 중심 디자인:**
   - 제공된 컨셉을 중심으로 전체 디자인을 구성하세요.
   - 컨셉의 느낌, 분위기, 스타일을 시안 전체에 일관되게 반영하세요.
   - 컨셉과 로고, 텍스트가 조화롭게 어우러지도록 배치하세요.

3. **요소 통합:**
   - 제공된 로고를 컨셉에 맞게 적절한 위치와 크기로 배치하세요.
   - 텍스트 요청사항을 컨셉과 조화롭게 반영하세요.
   - 레퍼런스의 디자인 스타일을 참고하되, 컨셉에 맞게 재해석하세요.
   - 추가 이미지들을 컨셉에 맞게 활용하세요.

4. **제안용 시안의 완성도:**
   - 고객이 제품을 제작하고 싶게 만드는 매력적인 디자인을 만들어야 합니다.
   - 컨셉, 로고, 텍스트가 하나의 통일된 스토리를 전달하도록 구성하세요.
   - 시각적으로 임팩트 있고 기억에 남는 디자인을 만들어주세요.

5. **시각적 품질:**
   - 고해상도, 선명한 이미지를 생성하세요.
   - 제품의 3D 형태와 입체감을 표현하세요.
   - 조명과 그림자를 자연스럽게 표현하세요.
   - 아크릴의 투명감과 반사 효과를 표현하세요.

6. **최종 확인:**
   - 생성된 시안에서 아크릴 판과 손잡이가 명확히 구분되는지 확인하세요.
   - 기본형의 구조가 정확히 유지되었는지 확인하세요.
   - 전제조건이 모두 준수되었는지 확인하세요.
   - 컨셉이 시안 전체에 일관되게 반영되었는지 확인하세요.
   - 모든 디자인 요소(로고, 텍스트, 컨셉)가 조화롭게 통합되었는지 확인하세요.

위의 모든 요구사항을 정확히 반영하여, 컨셉을 중심으로 로고와 텍스트를 종합적으로 분석한 **고품질의 제안용 아크릴 응원봉 시안 이미지**를 생성해주세요.`;

      // 프롬프트를 첫 번째로 추가
      parts.unshift(prompt);

      // Gemini API 호출
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      
      // 응답에서 이미지 데이터 확인
      const responseText = response.text();
      console.log('Gemini API 응답 텍스트:', responseText);
      
      // 응답의 parts 확인 (이미지 데이터가 있을 수 있음)
      const responseParts = response.candidates?.[0]?.content?.parts || [];
      console.log('응답 parts:', JSON.stringify(responseParts, null, 2));
      
      // 이미지 데이터가 있는지 확인
      for (const part of responseParts) {
        if (part.inlineData) {
          return {
            type: 'image',
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          };
        }
      }
      
      // 이미지가 없으면 텍스트 반환
      return {
        type: 'text',
        text: responseText,
      };
    } catch (error) {
      console.error('시안 생성 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 시안 수정: 기존 시안 이미지를 바탕으로 텍스트 요청사항을 반영하여 수정
   */
  async modifyDesign(params: {
    originalImagePath: string;
    modificationText: string;
  }): Promise<{ type: 'image' | 'text'; data?: string; mimeType?: string; text?: string }> {
    try {
      const parts: any[] = [];
      
      // 프롬프트 구성
      const prompt = `당신은 전문 제품 디자이너입니다. 
제공된 이미지는 아크릴 응원봉의 디자인 시안입니다.
이 디자인을 바탕으로 다음 **수정 요청사항**을 반영하여 새로운 디자인 시안을 생성해주세요.

## 수정 요청사항:
${params.modificationText}

## 작업 지침:
1. **기존 디자인 유지:** 수정 요청사항과 관련 없는 부분은 가능한 한 기존 디자인의 스타일, 형태, 구도를 유지하세요.
2. **요청사항 반영:** 수정 요청사항을 정확하고 자연스럽게 디자인에 반영하세요.
3. **고품질:** 고해상도의 선명하고 사실적인 3D 렌더링 스타일로 이미지를 생성하세요.
4. **구조 유지:** 응원봉의 기본 구조(손잡이와 아크릴 판)는 명확히 유지되어야 합니다.

위 요청사항을 반영하여 수정된 아크릴 응원봉 디자인 이미지를 생성해주세요.`;

      // 기존 이미지 추가
      const originalImageData = await this.fileToBase64(params.originalImagePath);
      const originalMimeType = this.getMimeType(params.originalImagePath);
      
      parts.push({
        inlineData: {
          data: originalImageData,
          mimeType: originalMimeType,
        },
      });

      // 프롬프트 추가
      parts.push(prompt);

      // Gemini API 호출
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      
      const responseParts = response.candidates?.[0]?.content?.parts || [];
      
      // 이미지 데이터 확인
      for (const part of responseParts) {
        if (part.inlineData) {
          return {
            type: 'image',
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          };
        }
      }
      
      return {
        type: 'text',
        text: response.text(),
      };
    } catch (error) {
      console.error('시안 수정 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 모델 정보 조회
   */
  getModelInfo() {
    return config.model;
  }
}
