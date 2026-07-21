import { Router } from 'express';
import { checkDomain, claimDomain, getUserDomains, verifyDomain, deleteDomain } from '../controllers/domainController';

const router = Router();

router.get('/check', checkDomain);
router.post('/claim', claimDomain);
router.get('/', getUserDomains);
router.post('/verify', verifyDomain);
router.delete('/:id', deleteDomain);

export default router;
