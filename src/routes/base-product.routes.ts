import { Router } from 'express';
import { BaseProductController } from '../controllers/base-product.controller.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = Router();
const controller = new BaseProductController();

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', uploadSingle('image'), (req, res) => controller.create(req, res));
router.put('/:id', uploadSingle('image'), (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;

