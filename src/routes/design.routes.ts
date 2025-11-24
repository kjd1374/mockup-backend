import { Router } from 'express';
import { DesignController } from '../controllers/design.controller.js';
import { uploadFields } from '../middleware/upload.middleware.js';

const router = Router();
const controller = new DesignController();

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post(
  '/',
  uploadFields([
    { name: 'logo', maxCount: 1 },
    { name: 'userImages', maxCount: 10 },
  ]),
  (req, res) => controller.create(req, res)
);
router.post('/:id/simulation', (req, res) => controller.generateSimulation(req, res));
router.post('/:id/regenerate', (req, res) => controller.regenerate(req, res));
router.post('/:id/modify', (req, res) => controller.modify(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;

