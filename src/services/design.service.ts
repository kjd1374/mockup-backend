import { PrismaClient } from '@prisma/client';
import { saveFile, UPLOAD_DIRS } from '../utils/file-utils.js';
import { GeminiService } from './gemini-service.js';
import { SimulationService } from './simulation-service.js';
import { readFileBuffer } from '../utils/file-utils.js';

const prisma = new PrismaClient();

export class DesignService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * 모든 시안 조회
   */
  async getAll(baseProductId?: number) {
    return await prisma.design.findMany({
      where: baseProductId ? { baseProductId } : undefined,
      include: {
        baseProduct: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ID로 시안 조회
   */
  async getById(id: number) {
    return await prisma.design.findUnique({
      where: { id },
      include: {
        baseProduct: true,
      },
    });
  }

  /**
   * 시안 생성
   */
  async create(data: {
    baseProductId: number;
    referenceIds: number[];
    logoBuffer?: Buffer;
    logoMimeType?: string;
    userImageBuffers?: Buffer[];
    userImageMimeTypes?: string[];
    text?: string;
    concept?: string;
  }) {
    // 기본형 조회
    const baseProduct = await prisma.baseProduct.findUnique({
      where: { id: data.baseProductId },
      include: {
        references: true,
      },
    });

    if (!baseProduct) {
      throw new Error('기본형을 찾을 수 없습니다.');
    }

    // 로고 저장
    let logoPath: string | null = null;
    if (data.logoBuffer) {
      logoPath = await saveFile(
        data.logoBuffer,
        UPLOAD_DIRS.LOGOS,
        `logo.${data.logoMimeType?.split('/')[1] || 'png'}`
      );
    }

    // 사용자 이미지들 저장
    const userImagePaths: string[] = [];
    if (data.userImageBuffers && data.userImageBuffers.length > 0) {
      for (let i = 0; i < data.userImageBuffers.length; i++) {
        const buffer = data.userImageBuffers[i];
        const mimeType = data.userImageMimeTypes?.[i] || 'image/png';
        const ext = mimeType.split('/')[1] || 'png';
        const path = await saveFile(
          buffer,
          UPLOAD_DIRS.USER_IMAGES,
          `user-image-${i}.${ext}`
        );
        userImagePaths.push(path);
      }
    }

    // 시안 레코드 생성 (pending 상태)
    const design = await prisma.design.create({
      data: {
        baseProductId: data.baseProductId,
        logoPath,
        userImages: JSON.stringify(userImagePaths),
        text: data.text || null,
        concept: data.concept || null,
        status: 'pending',
      },
      include: {
        baseProduct: true,
      },
    });

    // 백그라운드에서 AI 시안 생성
    this.generateDesignAsync(design.id, {
      baseProduct,
      referenceIds: data.referenceIds,
      logoBuffer: data.logoBuffer,
      logoMimeType: data.logoMimeType,
      userImageBuffers: data.userImageBuffers,
      userImageMimeTypes: data.userImageMimeTypes,
      text: data.text,
    }).catch((error: any) => {
      const errorMessage = error?.message || String(error) || '알 수 없는 오류';
      console.error(`[시안 생성] 최종 실패 - Design ID: ${design.id}`, errorMessage);
      console.error('[시안 생성] 에러 상세:', error);
      // 실패 상태로 업데이트 (이미 generateDesignAsync에서 처리했을 수 있지만, 안전을 위해 다시 확인)
      prisma.design.update({
        where: { id: design.id },
        data: { status: 'failed' },
      }).catch((updateError) => {
        console.error('[시안 생성] 상태 업데이트 실패:', updateError);
      });
    });

    return design;
  }

  /**
   * 비동기로 시안 생성 (백그라운드 처리)
   */
  private async generateDesignAsync(
    designId: number,
    data: {
      baseProduct: any;
      referenceIds: number[];
      logoBuffer?: Buffer;
      logoMimeType?: string;
      userImageBuffers?: Buffer[];
      userImageMimeTypes?: string[];
      text?: string;
      concept?: string;
    }
  ) {
    try {
      // 레퍼런스 이미지 경로들 가져오기
      const references = data.baseProduct.references.filter((ref: any) =>
        data.referenceIds.length === 0 || data.referenceIds.includes(ref.id)
      );
      const referenceImagePaths = references.map((ref: any) => ref.imagePath);

      // Gemini API로 시안 생성
      const result = await this.geminiService.generateDesign({
        baseProductImagePath: data.baseProduct.imagePath,
        referenceImagePaths,
        logoBuffer: data.logoBuffer,
        logoMimeType: data.logoMimeType,
        userImageBuffers: data.userImageBuffers,
        userImageMimeTypes: data.userImageMimeTypes,
        text: data.text,
        concept: data.concept,
        constraints: data.baseProduct.constraints,
      });

      let generatedImagePath: string | null = null;

      // 이미지 데이터가 있으면 파일로 저장
      if (result.type === 'image' && result.data && result.mimeType) {
        try {
          // base64 데이터를 Buffer로 변환
          const imageBuffer = Buffer.from(result.data, 'base64');
          
          // 파일 확장자 결정
          const ext = result.mimeType.split('/')[1] || 'png';
          const filename = `design-${designId}-${Date.now()}.${ext}`;
          
          // 파일 저장
          generatedImagePath = await saveFile(
            imageBuffer,
            UPLOAD_DIRS.GENERATED,
            filename
          );
          
          console.log('생성된 이미지 저장 완료:', generatedImagePath);
        } catch (error) {
          console.error('이미지 저장 실패:', error);
        }
      } else if (result.type === 'text') {
        // 텍스트 응답인 경우 - 이미지 생성 모델이 텍스트만 반환한 것은 오류
        console.error('[시안 생성] 이미지가 아닌 텍스트 응답을 받았습니다:', result.text);
        throw new Error(`이미지 생성 실패: AI가 텍스트만 반환했습니다. 응답: ${result.text?.substring(0, 200)}`);
      }
      
      // 이미지가 생성되지 않은 경우 실패 처리
      if (!generatedImagePath) {
        console.error('[시안 생성] 이미지 파일이 생성되지 않았습니다.');
        throw new Error('이미지 파일 생성에 실패했습니다.');
      }
      
      // 완료 상태로 업데이트
      await prisma.design.update({
        where: { id: designId },
        data: {
          status: 'completed',
          generatedImagePath,
        },
      });
      
      console.log(`[시안 생성] 완료 - Design ID: ${designId}, 이미지 경로: ${generatedImagePath}`);
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || '알 수 없는 오류';
      console.error(`[시안 생성] 실패 - Design ID: ${designId}`, errorMessage);
      console.error('[시안 생성] 에러 상세:', error);
      
      await prisma.design.update({
        where: { id: designId },
        data: { status: 'failed' },
      });
      
      // 에러를 다시 throw하지 않음 (이미 상태 업데이트 완료)
    }
  }

  /**
   * 시뮬레이션 생성
   */
  async generateSimulation(designId: number) {
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: { baseProduct: true },
    });

    if (!design) {
      throw new Error('시안을 찾을 수 없습니다.');
    }

    if (!design.generatedImagePath) {
      throw new Error('시안 이미지가 생성되지 않았습니다.');
    }

    // 시뮬레이션 상태를 generating으로 업데이트
    await prisma.design.update({
      where: { id: designId },
      data: { simulationStatus: 'generating' },
    });

    // 백그라운드에서 시뮬레이션 생성
    this.generateSimulationAsync(designId, design).catch((error) => {
      console.error('시뮬레이션 생성 실패:', error);
      prisma.design.update({
        where: { id: designId },
        data: { simulationStatus: 'failed' },
      });
    });

    return { success: true, message: '시뮬레이션 생성이 시작되었습니다.' };
  }

  /**
   * 비동기로 시뮬레이션 생성
   */
  private async generateSimulationAsync(designId: number, design: any) {
    const simulationService = new SimulationService();
    const simulationImages: string[] = [];

    try {
      console.log(`[시뮬레이션] 시작 - Design ID: ${designId}`);
      
      // 3개의 시뮬레이션 이미지 생성
      for (let i = 1; i <= 3; i++) {
        console.log(`[시뮬레이션] ${i}/3 생성 시작...`);
        const startTime = Date.now();
        
        try {
          const result = await simulationService.generateSimulation(
            design.generatedImagePath!,
            design.concept,
            i as 1 | 2 | 3
          );

          const elapsedTime = Date.now() - startTime;
          console.log(`[시뮬레이션] ${i}/3 API 응답 받음 (${elapsedTime}ms)`);

          if (result.type === 'image' && result.data && result.mimeType) {
            console.log(`[시뮬레이션] ${i}/3 이미지 데이터 수신 (크기: ${result.data.length} bytes)`);
            
            // base64 데이터를 Buffer로 변환
            const imageBuffer = Buffer.from(result.data, 'base64');
            
            // 파일 확장자 결정
            const ext = result.mimeType.split('/')[1] || 'png';
            const filename = `simulation-${designId}-${i}-${Date.now()}.${ext}`;
            
            // 파일 저장
            const imagePath = await saveFile(
              imageBuffer,
              UPLOAD_DIRS.GENERATED,
              filename
            );
            
            simulationImages.push(imagePath);
            console.log(`[시뮬레이션] ${i}/3 저장 완료: ${imagePath}`);
          } else {
            console.warn(`[시뮬레이션] ${i}/3 텍스트 응답을 받았습니다:`, result.text?.substring(0, 100));
            throw new Error(`시뮬레이션 ${i}는 이미지가 아닌 텍스트 응답을 받았습니다.`);
          }
        } catch (error: any) {
          console.error(`[시뮬레이션] ${i}/3 생성 실패:`, error.message);
          throw new Error(`시뮬레이션 ${i} 생성 실패: ${error.message}`);
        }
      }

      console.log(`[시뮬레이션] 모든 이미지 생성 완료 (총 ${simulationImages.length}개)`);

      // 완료 상태로 업데이트
      await prisma.design.update({
        where: { id: designId },
        data: {
          simulationStatus: 'completed',
          simulationImages: JSON.stringify(simulationImages),
        },
      });
      
      console.log(`[시뮬레이션] 완료 - Design ID: ${designId}`);
    } catch (error: any) {
      console.error('[시뮬레이션] 생성 중 오류:', error);
      await prisma.design.update({
        where: { id: designId },
        data: { simulationStatus: 'failed' },
      });
      throw error;
    }
  }

  /**
   * 시안 재생성 (동일한 조건으로 새로운 시안 생성)
   */
  async regenerate(designId: number) {
    // 기존 시안 정보 조회
    const existingDesign = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        baseProduct: {
          include: {
            references: true,
          },
        },
      },
    });

    if (!existingDesign) {
      throw new Error('시안을 찾을 수 없습니다.');
    }

    // 기존 시안의 로고와 사용자 이미지 파일 읽기
    let logoBuffer: Buffer | undefined;
    let logoMimeType: string | undefined;
    if (existingDesign.logoPath) {
      try {
        logoBuffer = await readFileBuffer(existingDesign.logoPath);
        logoMimeType = this.getMimeType(existingDesign.logoPath);
      } catch (error: any) {
        console.warn(`[시안 재생성] 로고 파일 읽기 실패: ${existingDesign.logoPath}`, error.message);
      }
    }

    const userImageBuffers: Buffer[] = [];
    const userImageMimeTypes: string[] = [];
    if (existingDesign.userImages) {
      try {
        const userImagePaths = JSON.parse(existingDesign.userImages) as string[];
        for (const imagePath of userImagePaths) {
          try {
            const buffer = await readFileBuffer(imagePath);
            userImageBuffers.push(buffer);
            userImageMimeTypes.push(this.getMimeType(imagePath));
          } catch (error: any) {
            console.warn(`[시안 재생성] 사용자 이미지 읽기 실패: ${imagePath}`, error.message);
          }
        }
      } catch (error) {
        console.warn('[시안 재생성] 사용자 이미지 파싱 실패:', error);
      }
    }

    // 레퍼런스 ID 목록 (기존 시안 생성 시 사용된 레퍼런스들)
    const referenceIds = existingDesign.baseProduct.references.map((ref: any) => ref.id);

    // 새로운 시안 생성 (기존과 동일한 조건)
    const newDesign = await this.create({
      baseProductId: existingDesign.baseProductId,
      referenceIds,
      logoBuffer,
      logoMimeType,
      userImageBuffers: userImageBuffers.length > 0 ? userImageBuffers : undefined,
      userImageMimeTypes: userImageMimeTypes.length > 0 ? userImageMimeTypes : undefined,
      text: existingDesign.text || undefined,
      concept: existingDesign.concept || undefined,
    });

    console.log(`[시안 재생성] 완료 - 기존 Design ID: ${designId}, 새 Design ID: ${newDesign.id}`);
    return newDesign;
  }

  /**
   * MIME 타입 추출
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    return mimeTypes[ext || ''] || 'image/png';
  }

  /**
   * 시안 삭제
   */
  async delete(id: number) {
    const design = await prisma.design.findUnique({ where: { id } });
    
    if (!design) {
      throw new Error('시안을 찾을 수 없습니다.');
    }

    await prisma.design.delete({
      where: { id },
    });
  }
}

