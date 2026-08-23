import { Router } from 'express';
import { nikkeAccountController } from './account.controller.js';

const router = Router();

router.get('/me', nikkeAccountController.getMyAccount);
router.post('/me', nikkeAccountController.createMyAccount);

export default router;
