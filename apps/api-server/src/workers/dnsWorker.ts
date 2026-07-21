import { Worker } from 'bullmq';
import { redisClient } from '../config/redis';
import { cloudflareService } from '../services/cloudflareService';
import { Domain } from 'shared-models';

export const dnsWorker = new Worker(
  'dns-sync-queue',
  async (job) => {
    console.log(`Processing DNS Job: ${job.id}, Type: ${job.name}`);

    if (job.name === 'create-record') {
      const { domainId, rootDomain, recordPayload } = job.data;
      
      // 1. Fetch domain record from DB
      const domain = await Domain.findById(domainId);
      if (!domain) {
        throw new Error(`Domain ${domainId} not found in DB`);
      }

      // 2. Determine Zone ID (ideally cached, but we fetch from CF for this example)
      let zoneId = domain.cloudflareZoneId;
      if (!zoneId) {
        zoneId = await cloudflareService.getZoneId(rootDomain);
        // Cache it back to the DB for future runs
        domain.cloudflareZoneId = zoneId;
        await domain.save();
      }

      // 3. Push record to Cloudflare
      const cfRecord = await cloudflareService.createDNSRecord(zoneId, recordPayload, rootDomain);
      
      console.log(`Successfully created CF Record: ${cfRecord.id}`);
      
      // Note: In a complete implementation, you'd also want to store this `cfRecord.id` 
      // in a specific `DNSRecord` MongoDB collection so users can edit/delete it later.
      return { success: true, cfRecordId: cfRecord.id };
    }
  },
  { connection: redisClient }
);

dnsWorker.on('completed', (job) => {
  console.log(`DNS Job ${job.id} has completed!`);
});

dnsWorker.on('failed', (job, err) => {
  console.error(`DNS Job ${job?.id} has failed with error: ${err.message}`);
});
