import { Request, Response } from 'express';
import { ReferenceService } from '../services/reference.service.js';

export class ReferenceController {
  private service: ReferenceService;

  constructor() {
    this.service = new ReferenceService();
  }

  /**
   * 레퍼런스 목록 조회
   */
  async getAll(req: Request, res: Response) {
    try {
      const baseProductId = req.query.baseProductId 
        ? parseInt(req.query.baseProductId as string) 
        : undefined;
      
      const references = await this.service.getAll(baseProductId);
      res.json({ success: true, data: references });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 레퍼런스 상세 조회
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const reference = await this.service.getById(id);
      
      if (!reference) {
        return res.status(404).json({ success: false, error: '레퍼런스를 찾을 수 없습니다.' });
      }
      
      res.json({ success: true, data: reference });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 레퍼런스 생성
   */
  async create(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: '이미지 파일이 필요합니다.' });
      }

      const baseProductId = parseInt(req.body.baseProductId);
      const description = req.body.description || '';

      if (!baseProductId) {
        return res.status(400).json({ success: false, error: '기본형 ID는 필수입니다.' });
      }

      const reference = await this.service.create({
        baseProductId,
        description,
        imageBuffer: req.file.buffer,
        imageOriginalName: req.file.originalname,
        imageMimeType: req.file.mimetype,
      });

      res.status(201).json({ success: true, data: reference });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 레퍼런스 삭제
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.delete(id);
      res.json({ success: true, message: '레퍼런스가 삭제되었습니다.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

