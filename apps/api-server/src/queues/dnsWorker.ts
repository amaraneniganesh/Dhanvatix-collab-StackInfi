import { Worker, Job } from 'bullmq';
import { redisClient, isRedisEnabled } from '../config/redis';
import { cloudflareService } from '../services/cloudflareService';

export const processDNSJobDirectly = async (jobName: string, jobData: any) => {
  try {
    console.log(`Processing DNS Job directly (No Redis): ${jobName}`, jobData);
    const { rootDomain } = jobData;
    
    const zoneId = await cloudflareService.getZoneId(rootDomain);

    if (jobName === 'create-record') {
      const { recordPayload } = jobData;
      const result = await cloudflareService.createDNSRecord(zoneId, recordPayload, rootDomain);
      console.log(`[DNS Direct] Successfully created record in CF: ${result.id}`);
      return result;
    } 
    
    if (jobName === 'update-record') {
      const { recordId, recordPayload } = jobData;
      const result = await cloudflareService.updateDNSRecord(zoneId, recordId, recordPayload, rootDomain);
      console.log(`[DNS Direct] Successfully updated record in CF: ${result.id}`);
      return result;
    }
    
    if (jobName === 'delete-record') {
      const { recordId } = jobData;
      await cloudflareService.deleteDNSRecord(zoneId, recordId, rootDomain);
      console.log(`[DNS Direct] Successfully deleted record in CF: ${recordId}`);
      return true;
    }

    throw new Error(`Unknown job type: ${jobName}`);
  } catch (error) {
    console.error(`[DNS Direct] Job ${jobName} failed:`, error);
    throw error;
  }
};

export const dnsWorker = isRedisEnabled ? new Worker(
  'dns-sync-queue',
  async (job: Job) => {
    return processDNSJobDirectly(job.name, job.data);
  },
  { 
    connection: redisClient 
  }
) : null;

// Suppress excessive error logging from BullMQ worker trying to reconnect
if (dnsWorker) {
  dnsWorker.on('error', (err) => {
    // console.error('[BullMQ Worker] Error:', err.message);
  });
}
