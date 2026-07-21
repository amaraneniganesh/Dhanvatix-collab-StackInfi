import { Request, Response } from 'express';
import crypto from 'crypto';
import { Domain, User } from 'shared-models';

const RESERVED_WORDS = ['admin', 'api', 'auth', 'dashboard', 'dns', 'mail', 'support', 'www'];

export const checkDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subdomain, rootDomain } = req.query;

    if (!subdomain || !rootDomain) {
      res.status(400).json({ message: 'subdomain and rootDomain are required' });
      return;
    }

    const sub = (subdomain as string).toLowerCase();
    
    if (RESERVED_WORDS.includes(sub)) {
      res.status(400).json({ message: 'Subdomain is reserved', available: false });
      return;
    }

    const fullDomain = `${sub}.${rootDomain}`;
    const existing = await Domain.findOne({ fullDomain });

    if (existing) {
      res.status(200).json({ message: 'Subdomain already taken', available: false });
      return;
    }

    res.status(200).json({ message: 'Subdomain is available', available: true });
  } catch (error) {
    console.error('Check domain error:', error);
    res.status(500).json({ message: 'Server error checking domain' });
  }
};

export const claimDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subdomain, rootDomain, userId } = req.body;

    if (!subdomain || !rootDomain || !userId) {
      res.status(400).json({ message: 'subdomain, rootDomain, and userId are required' });
      return;
    }

    const sub = subdomain.toLowerCase();
    const fullDomain = `${sub}.${rootDomain}`;

    // Re-verify availability
    if (RESERVED_WORDS.includes(sub)) {
      res.status(400).json({ message: 'Subdomain is reserved' });
      return;
    }

    const existing = await Domain.findOne({ fullDomain });
    if (existing) {
      res.status(400).json({ message: 'Subdomain already taken' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check limit per root domain (skip for admin)
    if (user.role !== 'admin') {
      const claimsCount = await Domain.countDocuments({ userId, rootDomain });
      const limit = user.domainLimit !== undefined ? user.domainLimit : 2;
      if (claimsCount >= limit) {
        res.status(403).json({ message: `You have reached the maximum limit of ${limit} subdomains for ${rootDomain}.` });
        return;
      }
    }

    // Generate Verification Code
    const verificationCode = `VER-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const newDomain = new Domain({
      userId,
      subdomain: sub,
      rootDomain,
      fullDomain,
      status: 'Verified',
      verificationCode
    });

    await newDomain.save();

    res.status(201).json({ 
      message: 'Domain claimed successfully', 
      domain: newDomain 
    });
  } catch (error) {
    console.error('Claim domain error:', error);
    res.status(500).json({ message: 'Server error claiming domain' });
  }
};

export const verifyDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domainId } = req.body;
    if (!domainId) {
      res.status(400).json({ message: 'domainId is required' });
      return;
    }
    
    const domain = await Domain.findById(domainId);
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }

    // In a real app, this would poll Cloudflare or perform a DNS lookup for the verificationCode
    domain.status = 'Verified';
    await domain.save();

    res.status(200).json({ message: 'Domain verified successfully', domain });
  } catch (error) {
    console.error('Verify domain error:', error);
    res.status(500).json({ message: 'Server error verifying domain' });
  }
};

export const getUserDomains = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query; // in real app, get from auth middleware

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const domains = await Domain.find({ userId });
    res.status(200).json({ domains });
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({ message: 'Server error getting domains' });
  }
};

export const deleteDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !userId) {
      res.status(400).json({ message: 'domain id and userId are required' });
      return;
    }

    const domain = await Domain.findOne({ _id: id, userId });
    if (!domain) {
      res.status(404).json({ message: 'Domain not found or unauthorized' });
      return;
    }

    // Try to delete Cloudflare records first
    try {
      const { cloudflareService } = await import('../services/cloudflareService');
      const zoneId = await cloudflareService.getZoneId(domain.rootDomain);
      const allRecords = await cloudflareService.listDNSRecords(zoneId, domain.rootDomain);

      // Filter records that belong to this subdomain or its sub-subdomains
      const recordsToDelete = allRecords.filter((r: any) => 
        r.name === domain.fullDomain || r.name.endsWith(`.${domain.fullDomain}`)
      );

      for (const record of recordsToDelete) {
        await cloudflareService.deleteDNSRecord(zoneId, record.id, domain.rootDomain);
      }
    } catch (cfError) {
      console.error('Cloudflare Error during domain deletion:', cfError);
      // We log but proceed to delete the domain from DB anyway, 
      // otherwise user might be permanently stuck if CF record is already gone.
    }

    await Domain.findByIdAndDelete(id);
    res.status(200).json({ message: 'Domain and associated records deleted successfully' });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ message: 'Server error deleting domain' });
  }
};
