import { Router } from 'express';
import { register, login, verifyOtp, googleOAuthStub, githubOAuthStub } from '../controllers/authController';
import { requestPasswordReset, resetPassword } from '../controllers/userController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/request-password-reset-otp', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/google', googleOAuthStub);
router.get('/github', githubOAuthStub);

export default router;
