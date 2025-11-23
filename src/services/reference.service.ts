import { PrismaClient } from '@prisma/client';
import { saveFile, UPLOAD_DIRS } from '../utils/file-utils.js';

const prisma = new PrismaClient();

export class ReferenceService {
  /**
   * 모든 레퍼런스 조회
   */
  async getAll(baseProductId?: number) {
    return await prisma.reference.findMany({
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
   * ID로 레퍼런스 조회
   */
  async getById(id: number) {
    return await prisma.reference.findUnique({
      where: { id },
      include: {
        baseProduct: true,
      },
    });
  }

  /**
   * 레퍼런스 생성
   */
  async create(data: {
    baseProductId: number;
    description: string;
    imageBuffer: Buffer;
    imageOriginalName: string;
    imageMimeType: string;
  }) {
    // 기본형 존재 확인
    const baseProduct = await prisma.baseProduct.findUnique({
      where: { id: data.baseProductId },
    });

    if (!baseProduct) {
      throw new Error('기본형을 찾을 수 없습니다.');
    }

    // 이미지 저장
    const imagePath = await saveFile(
      data.imageBuffer,
      UPLOAD_DIRS.REFERENCES,
      data.imageOriginalName
    );

    // DB 저장
    return await prisma.reference.create({
      data: {
        baseProductId: data.baseProductId,
        description: data.description,
        imagePath,
      },
      include: {
        baseProduct: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 레퍼런스 삭제
   */
  async delete(id: number) {
    const reference = await prisma.reference.findUnique({ where: { id } });
    
    if (!reference) {
      throw new Error('레퍼런스를 찾을 수 없습니다.');
    }

    await prisma.reference.delete({
      where: { id },
    });
  }
}

