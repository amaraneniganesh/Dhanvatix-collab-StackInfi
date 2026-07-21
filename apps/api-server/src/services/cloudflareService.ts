import Cloudflare from 'cloudflare';

// Initialize the Cloudflare clients using the API tokens from environment variables
const cfDefault = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN || 'fake_token_for_dev',
});

const cfSecondary = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN_2 || 'fake_token_for_dev',
});

const getCfClient = (domainName: string) => {
  if (domainName && domainName.includes('stackinfi')) {
    return { cf: cfSecondary, apiToken: process.env.CLOUDFLARE_API_TOKEN_2 };
  }
  return { cf: cfDefault, apiToken: process.env.CLOUDFLARE_API_TOKEN };
};

/**
 * Service to interact with Cloudflare's DNS API.
 * In development, if a fake token is used, these methods can just return mock responses.
 */
export const cloudflareService = {
  /**
   * Fetches the Zone ID for a root domain (e.g., 'stackinfi.in')
   */
  async getZoneId(domainName: string): Promise<string> {
    try {
      const { cf, apiToken } = getCfClient(domainName);
      if (process.env.NODE_ENV === 'development' && apiToken === undefined) {
        console.log(`[MOCK] getZoneId for ${domainName}`);
        return 'mock_zone_id_123';
      }

      const response = await cf.zones.list({ query: { name: domainName } });
      const zones = response.result;
      
      if (!zones || zones.length === 0) {
        throw new Error(`Zone for ${domainName} not found`);
      }
      return zones[0].id;
    } catch (error) {
      console.error('Cloudflare getZoneId Error:', error);
      throw error;
    }
  },

  /**
   * Fetches all DNS records for a specific zone.
   */
  async listDNSRecords(zoneId: string, domainName: string): Promise<any[]> {
    try {
      const { cf, apiToken } = getCfClient(domainName);
      if (process.env.NODE_ENV === 'development' && apiToken === undefined) {
        console.log(`[MOCK] listDNSRecords in zone ${zoneId}`);
        return [
          { id: 'mock_1', type: 'A', name: domainName, content: '192.168.1.1', proxied: true, ttl: 1 }
        ];
      }

      const response = await cf.dns.records.list({ zone_id: zoneId });
      return response.result || [];
    } catch (error) {
      console.error('Cloudflare listDNSRecords Error:', error);
      throw error;
    }
  },

  /**
   * Creates a DNS Record in a specific zone.
   */
  async createDNSRecord(zoneId: string, recordPayload: any, domainName: string): Promise<any> {
    try {
      const { cf, apiToken } = getCfClient(domainName);
      if (process.env.NODE_ENV === 'development' && apiToken === undefined) {
        console.log(`[MOCK] createDNSRecord in zone ${zoneId}`, recordPayload);
        return { id: 'mock_cf_record_' + Date.now(), ...recordPayload };
      }

      const response = await cf.dns.records.create({
        zone_id: zoneId,
        type: recordPayload.type,
        name: recordPayload.name,
        content: recordPayload.content,
        ttl: recordPayload.ttl || 1, // 1 is automatic
        proxied: recordPayload.proxied || false,
      });

      return response.result;
    } catch (error) {
      console.error('Cloudflare createDNSRecord Error:', error);
      throw error;
    }
  },

  /**
   * Deletes a DNS Record from a specific zone.
   */
  async deleteDNSRecord(zoneId: string, recordId: string, domainName: string): Promise<boolean> {
    try {
      const { cf, apiToken } = getCfClient(domainName);
      if (process.env.NODE_ENV === 'development' && apiToken === undefined) {
        console.log(`[MOCK] deleteDNSRecord ${recordId} in zone ${zoneId}`);
        return true;
      }

      await cf.dns.records.delete(recordId, {
        zone_id: zoneId
      });

      return true;
    } catch (error) {
      console.error('Cloudflare deleteDNSRecord Error:', error);
      throw error;
    }
  },

  /**
   * Updates a DNS Record in a specific zone.
   */
  async updateDNSRecord(zoneId: string, recordId: string, recordPayload: any, domainName: string): Promise<any> {
    try {
      const { cf, apiToken } = getCfClient(domainName);
      if (process.env.NODE_ENV === 'development' && apiToken === undefined) {
        console.log(`[MOCK] updateDNSRecord ${recordId} in zone ${zoneId}`, recordPayload);
        return { id: recordId, ...recordPayload };
      }

      const response = await cf.dns.records.update(recordId, {
        zone_id: zoneId,
        type: recordPayload.type,
        name: recordPayload.name,
        content: recordPayload.content,
        ttl: recordPayload.ttl || 1, // 1 is automatic
        proxied: recordPayload.proxied || false,
      });

      return response.result;
    } catch (error) {
      console.error('Cloudflare updateDNSRecord Error:', error);
      throw error;
    }
  }
};
