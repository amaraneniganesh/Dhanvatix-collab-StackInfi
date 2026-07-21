import { Queue } from 'bullmq';
import { redisClient, isRedisEnabled } from '../config/redis';

// Only create Queue if Redis is enabled
export const dnsQueue = isRedisEnabled ? new Queue('dns-sync-queue', { 
  connection: redisClient 
}) : null;

export const dispatchCreateDNSRecord = async (jobData: { 
  domainId: string; 
  rootDomain: string; 
  recordPayload: any; 
}) => {
  if (!isRedisEnabled) {
    const { processDNSJobDirectly } = await import('./dnsWorker');
    await processDNSJobDirectly('create-record', jobData);
    return;
  }
  await dnsQueue!.add('create-record', jobData, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
};

export const dispatchUpdateDNSRecord = async (jobData: { 
  domainId: string; 
  rootDomain: string; 
  recordId: string;
  recordPayload: any; 
}) => {
  if (!isRedisEnabled) {
    const { processDNSJobDirectly } = await import('./dnsWorker');
    await processDNSJobDirectly('update-record', jobData);
    return;
  }
  await dnsQueue!.add('update-record', jobData, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
};

export const dispatchDeleteDNSRecord = async (jobData: { 
  domainId: string; 
  rootDomain: string; 
  recordId: string;
}) => {
  if (!isRedisEnabled) {
    const { processDNSJobDirectly } = await import('./dnsWorker');
    await processDNSJobDirectly('delete-record', jobData);
    return;
  }
  await dnsQueue!.add('delete-record', jobData, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
};
