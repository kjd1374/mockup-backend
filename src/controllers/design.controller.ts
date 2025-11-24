import { Request, Response } from 'express';
import { DesignService } from '../services/design.service.js';

export class DesignController {
  private service: DesignService;

  constructor() {
    this.service = new DesignService();
  }

  /**
   * 시안 목록 조회
   */
  async getAll(req: Request, res: Response) {
    try {
      const baseProductId = req.query.baseProductId 
        ? parseInt(req.query.baseProductId as string) 
        : undefined;
      
      const designs = await this.service.getAll(baseProductId);
      res.json({ success: true, data: designs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 시안 상세 조회
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const design = await this.service.getById(id);
      
      if (!design) {
        return res.status(404).json({ success: false, error: '시안을 찾을 수 없습니다.' });
      }
      
      res.json({ success: true, data: design });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 시안 생성
   */
  async create(req: Request, res: Response) {
    try {
      const baseProductId = parseInt(req.body.baseProductId);
      const text = req.body.text || '';
      const concept = req.body.concept || '';
      const referenceIds = req.body.referenceIds 
        ? JSON.parse(req.body.referenceIds) 
        : [];

      if (!baseProductId) {
        return res.status(400).json({ success: false, error: '기본형 ID는 필수입니다.' });
      }

      // 파일 처리
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const logoFile = files.logo?.[0];
      const userImageFiles = files.userImages || [];

      const design = await this.service.create({
        baseProductId,
        referenceIds,
        logoBuffer: logoFile?.buffer,
        logoMimeType: logoFile?.mimetype,
        userImageBuffers: userImageFiles.map(f => f.buffer),
        userImageMimeTypes: userImageFiles.map(f => f.mimetype),
        text,
        concept,
      });

      res.status(201).json({ success: true, data: design });
    } catch (error: any) {
      console.error('시안 생성 오류:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 시뮬레이션 생성
   */
  async generateSimulation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { promptIds } = req.body; // promptIds 배열 받기

      if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
        return res.status(400).json({ success: false, error: '시뮬레이션 조건을 1개 이상 선택해주세요.' });
      }

      if (promptIds.length > 3) {
        return res.status(400).json({ success: false, error: '시뮬레이션 조건은 최대 3개까지만 선택 가능합니다.' });
      }

      const result = await this.service.generateSimulation(id, promptIds);
      res.json(result);
    } catch (error: any) {
      console.error('시뮬레이션 생성 오류:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 시안 재생성
   */
  async regenerate(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const newDesign = await this.service.regenerate(id);
      res.json({ success: true, data: newDesign, message: '시안 재생성이 시작되었습니다.' });
    } catch (error: any) {
      console.error('시안 재생성 오류:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 시안 수정
   */
  async modify(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { modificationText } = req.body;

      if (!modificationText) {
        return res.status(400).json({ success: false, error: '수정 요청사항을 입력해주세요.' });
      }

      const newDesign = await this.service.modify(id, modificationText);
      res.json({ success: true, data: newDesign, message: '시안 수정이 시작되었습니다.' });
    } catch (error: any) {
      console.error('시안 수정 오류:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 시안 삭제
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.delete(id);
      res.json({ success: true, message: '시안이 삭제되었습니다.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

