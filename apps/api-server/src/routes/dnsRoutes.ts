import { Router } from 'express';
import { createRecord, getRecords, updateRecord, deleteRecord, whoisLookup } from '../controllers/dnsController';

const router = Router();

// Whois lookup
router.get('/whois', whoisLookup);

// In a real app, this route would be protected by the DNS Session JWT middleware
router.get('/:domainId/records', getRecords);
router.post('/:domainId/records', createRecord);
router.put('/:domainId/records/:recordId', updateRecord);
router.delete('/:domainId/records/:recordId', deleteRecord);

export default router;
