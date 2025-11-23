import { Request, Response } from 'express';
import { BaseProductService } from '../services/base-product.service.js';

export class BaseProductController {
  private service: BaseProductService;

  constructor() {
    this.service = new BaseProductService();
  }

  /**
   * 기본형 목록 조회
   */
  async getAll(req: Request, res: Response) {
    try {
      const products = await this.service.getAll();
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 기본형 상세 조회
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const product = await this.service.getById(id);
      
      if (!product) {
        return res.status(404).json({ success: false, error: '기본형을 찾을 수 없습니다.' });
      }
      
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 기본형 생성
   */
  async create(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: '이미지 파일이 필요합니다.' });
      }

      const { name, description, parts, constraints } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: '이름은 필수입니다.' });
      }

      console.log(`[기본형 생성] 시작 - 이름: ${name}, 파일 크기: ${req.file.size} bytes, MIME: ${req.file.mimetype}`);
      
      const product = await this.service.create({
        name,
        description: description || '',
        imageBuffer: req.file.buffer,
        imageOriginalName: req.file.originalname,
        imageMimeType: req.file.mimetype,
        parts: parts || null,
        constraints: constraints || null,
      });

      console.log(`[기본형 생성] 완료 - ID: ${product.id}, 이미지 경로: ${product.imagePath}`);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 기본형 수정
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, description, parts, constraints } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (parts !== undefined) updateData.parts = parts;
      if (constraints !== undefined) updateData.constraints = constraints;
      if (req.file) {
        updateData.imageBuffer = req.file.buffer;
        updateData.imageOriginalName = req.file.originalname;
        updateData.imageMimeType = req.file.mimetype;
      }

      const product = await this.service.update(id, updateData);
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 기본형 삭제
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.delete(id);
      res.json({ success: true, message: '기본형이 삭제되었습니다.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

