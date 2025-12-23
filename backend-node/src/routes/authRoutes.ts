import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { generateCaptcha } from '../controllers/captchaController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/captcha', generateCaptcha);

export default router;
