import { Router } from 'express';
import { adminLogin, getAllUsers, updateUserLimit, getDomainRecords } from '../controllers/adminController';

const router = Router();

router.post('/login', adminLogin);
router.get('/users', getAllUsers);
router.put('/users/:userId/limit', updateUserLimit);
router.get('/domains/:domainId/records', getDomainRecords);

export default router;
