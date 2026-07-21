import { Request, Response } from 'express';
import { Domain } from 'shared-models';

export const createRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domainId } = req.params;
    const { type, name, content, ttl, proxied } = req.body;

    if (!type || !name || !content) {
      res.status(400).json({ message: 'Type, name, and content are required' });
      return;
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }

    // Prepare payload for Cloudflare
    // If the user wants to point `app.test.stackinfi.in`, `name` needs to be fully qualified or relative depending on CF config.
    // Usually, Cloudflare accepts the fully qualified name.
    const fqdn = name === '@' || name === '' ? domain.fullDomain : `${name}.${domain.fullDomain}`;
    
    const recordPayload = {
      type,
      name: fqdn,
      content,
      ttl: ttl || 1,
      proxied: proxied || false
    };

    // Attempt direct synchronous creation
    const { cloudflareService } = await import('../services/cloudflareService');
    const zoneId = await cloudflareService.getZoneId(domain.rootDomain);
    
    try {
      const result = await cloudflareService.createDNSRecord(zoneId, recordPayload, domain.rootDomain);
      res.status(201).json({ 
        message: 'DNS record created successfully',
        record: result
      });
    } catch (cfError: any) {
      console.error('Cloudflare Error:', cfError);
      
      // Extract Cloudflare's specific error message if available
      let errorMessage = 'Failed to create record in Cloudflare';
      if (cfError.errors && cfError.errors.length > 0) {
        errorMessage = cfError.errors[0].message;
      } else if (cfError.message) {
        errorMessage = cfError.message;
      }
      
      res.status(400).json({ message: errorMessage });
    }
  } catch (error) {
    console.error('Create DNS record error:', error);
    res.status(500).json({ message: 'Server error creating DNS record' });
  }
};

export const getRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domainId } = req.params;
    const domain = await Domain.findById(domainId);
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }
    
    const { cloudflareService } = await import('../services/cloudflareService');
    const zoneId = await cloudflareService.getZoneId(domain.rootDomain);
    const allRecords = await cloudflareService.listDNSRecords(zoneId, domain.fullDomain);

    // Only show records that belong to this specific subdomain
    const records = allRecords.filter((r: any) => 
      r.name === domain.fullDomain || r.name.endsWith(`.${domain.fullDomain}`)
    );

    res.status(200).json({ records });
  } catch (error) {
    console.error('Get DNS records error:', error);
    res.status(500).json({ message: 'Server error fetching DNS records' });
  }
};

export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domainId, recordId } = req.params;
    const { type, name, content, ttl, proxied } = req.body;

    const domain = await Domain.findById(domainId);
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }

    const fqdn = name === '@' || name === '' ? domain.fullDomain : `${name}.${domain.fullDomain}`;
    const recordPayload = { type, name: fqdn, content, ttl: ttl || 1, proxied: proxied || false };

    const { cloudflareService } = await import('../services/cloudflareService');
    const zoneId = await cloudflareService.getZoneId(domain.rootDomain);

    try {
      const result = await cloudflareService.updateDNSRecord(zoneId, recordId, recordPayload, domain.rootDomain);
      res.status(200).json({ 
        message: 'DNS record updated successfully',
        record: result
      });
    } catch (cfError: any) {
      console.error('Cloudflare Error:', cfError);
      
      let errorMessage = 'Failed to update record in Cloudflare';
      if (cfError.errors && cfError.errors.length > 0) {
        errorMessage = cfError.errors[0].message;
      } else if (cfError.message) {
        errorMessage = cfError.message;
      }
      
      res.status(400).json({ message: errorMessage });
    }
  } catch (error) {
    console.error('Update DNS record error:', error);
    res.status(500).json({ message: 'Server error updating DNS record' });
  }
};

export const deleteRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domainId, recordId } = req.params;
    const domain = await Domain.findById(domainId);
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }

    const { cloudflareService } = await import('../services/cloudflareService');
    const zoneId = await cloudflareService.getZoneId(domain.rootDomain);

    try {
      await cloudflareService.deleteDNSRecord(zoneId, recordId, domain.rootDomain);
      res.status(200).json({ message: 'DNS record deleted successfully' });
    } catch (cfError: any) {
      console.error('Cloudflare Error:', cfError);
      
      let errorMessage = 'Failed to delete record in Cloudflare';
      if (cfError.errors && cfError.errors.length > 0) {
        errorMessage = cfError.errors[0].message;
      } else if (cfError.message) {
        errorMessage = cfError.message;
      }
      
      res.status(400).json({ message: errorMessage });
    }
  } catch (error) {
    console.error('Delete DNS record error:', error);
    res.status(500).json({ message: 'Server error deleting DNS record' });
  }
};

export const whoisLookup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
      res.status(400).json({ message: 'Domain query parameter is required' });
      return;
    }

    // Using who-dat API for free JSON WHOIS
    const response = await fetch(`https://who-dat.as93.net/${domain}`);
    if (!response.ok) {
      // Fallback to rdap if who-dat fails
      const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`);
      if (rdapResponse.ok) {
        const rdapData = await rdapResponse.json();
        res.status(200).json(rdapData);
        return;
      }
      res.status(response.status).json({ message: 'Failed to fetch WHOIS data' });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Whois lookup error:', error);
    res.status(500).json({ message: 'Server error fetching WHOIS data' });
  }
};
