import { Router } from 'express';
import { nikkeCharacterController } from './character.controller.js';

const router = Router();

router.get('/', nikkeCharacterController.getMyRoster);
router.post('/', nikkeCharacterController.addNikke);

export default router;
