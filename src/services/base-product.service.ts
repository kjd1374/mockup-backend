import { PrismaClient } from '@prisma/client';
import { saveFile, UPLOAD_DIRS } from '../utils/file-utils.js';

const prisma = new PrismaClient();

export class BaseProductService {
  /**
   * 모든 기본형 조회
   */
  async getAll() {
    return await prisma.baseProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ID로 기본형 조회
   */
  async getById(id: number) {
    return await prisma.baseProduct.findUnique({
      where: { id },
      include: {
        references: true,
        designs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * 기본형 생성
   */
  async create(data: {
    name: string;
    description: string;
    imageBuffer: Buffer;
    imageOriginalName: string;
    imageMimeType: string;
    parts?: string; // JSON 문자열
    constraints?: string; // 전제조건
  }) {
    // 이미지 저장
    const imagePath = await saveFile(
      data.imageBuffer,
      UPLOAD_DIRS.BASE_PRODUCTS,
      data.imageOriginalName
    );

    // DB 저장
    return await prisma.baseProduct.create({
      data: {
        name: data.name,
        description: data.description,
        imagePath,
        parts: data.parts || null,
        constraints: data.constraints || null,
      },
    });
  }

  /**
   * 기본형 수정
   */
  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      imageBuffer?: Buffer;
      imageOriginalName?: string;
      imageMimeType?: string;
      parts?: string; // JSON 문자열
      constraints?: string; // 전제조건
    }
  ) {
    const product = await prisma.baseProduct.findUnique({ where: { id } });
    
    if (!product) {
      throw new Error('기본형을 찾을 수 없습니다.');
    }

    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    
    if (data.parts !== undefined) {
      updateData.parts = data.parts;
    }
    
    if (data.constraints !== undefined) {
      updateData.constraints = data.constraints;
    }
    
    // 이미지가 있으면 새로 저장
    if (data.imageBuffer) {
      const imagePath = await saveFile(
        data.imageBuffer,
        UPLOAD_DIRS.BASE_PRODUCTS,
        data.imageOriginalName || 'image.png'
      );
      updateData.imagePath = imagePath;
    }

    return await prisma.baseProduct.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 기본형 삭제
   */
  async delete(id: number) {
    const product = await prisma.baseProduct.findUnique({ where: { id } });
    
    if (!product) {
      throw new Error('기본형을 찾을 수 없습니다.');
    }

    // 관련 레퍼런스와 시안도 함께 삭제됨 (Cascade)
    await prisma.baseProduct.delete({
      where: { id },
    });
  }
}

