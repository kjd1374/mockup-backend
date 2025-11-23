import { Router } from 'express';
import { ReferenceController } from '../controllers/reference.controller.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = Router();
const controller = new ReferenceController();

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', uploadSingle('image'), (req, res) => controller.create(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;

