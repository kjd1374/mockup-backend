import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export class SimulationPromptController {
  /**
   * 모든 프롬프트 조회
   */
  async getAll(req: Request, res: Response) {
    try {
      const prompts = await prisma.simulationPrompt.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: prompts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 프롬프트 생성
   */
  async create(req: Request, res: Response) {
    try {
      const { name, prompt, isDefault } = req.body;
      
      if (!name || !prompt) {
        return res.status(400).json({ success: false, error: '이름과 프롬프트 내용은 필수입니다.' });
      }

      const newPrompt = await prisma.simulationPrompt.create({
        data: {
          name,
          prompt,
          isDefault: isDefault || false,
        },
      });

      res.status(201).json({ success: true, data: newPrompt });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 프롬프트 수정
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, prompt, isDefault } = req.body;

      const updatedPrompt = await prisma.simulationPrompt.update({
        where: { id },
        data: {
          name,
          prompt,
          isDefault,
        },
      });

      res.json({ success: true, data: updatedPrompt });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 프롬프트 삭제
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      await prisma.simulationPrompt.delete({
        where: { id },
      });

      res.json({ success: true, message: '삭제되었습니다.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

