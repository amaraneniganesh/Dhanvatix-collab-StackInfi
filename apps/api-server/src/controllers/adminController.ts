import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, Domain } from 'shared-models';

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      res.status(401).json({ message: 'Invalid admin credentials or insufficient permissions' });
      return;
    }

    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.default.compare(password, user.passwordHash!);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid admin credentials' });
      return;
    }
    
    const token = jwt.sign({ role: 'admin', userId: user._id }, process.env.JWT_SECRET_PORTAL || 'secret', { expiresIn: '1d' });
    res.status(200).json({ message: 'Admin login successful', token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real app, verify the admin token middleware here
    
    // Fetch all users
    const users = await User.find().select('-passwordHash -otpCode').lean();
    
    // Fetch domains for these users to aggregate
    const allDomains = await Domain.find().lean();
    
    const enrichedUsers = users.map(user => {
      const userDomains = allDomains.filter(d => d.userId.toString() === user._id.toString());
      return {
        ...user,
        domains: userDomains
      };
    });
    
    res.status(200).json({ users: enrichedUsers });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const updateUserLimit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit } = req.body;
    
    if (typeof limit !== 'number') {
      res.status(400).json({ message: 'Limit must be a number' });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    user.domainLimit = limit;
    await user.save();
    
    res.status(200).json({ message: 'User domain limit updated', limit });
  } catch (error) {
    console.error('Update limit error:', error);
    res.status(500).json({ message: 'Server error updating limit' });
  }
};

export const getDomainRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domainId } = req.params;
    
    const domain = await Domain.findById(domainId);
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }
    
    const { cloudflareService } = await import('../services/cloudflareService');
    const zoneId = await cloudflareService.getZoneId(domain.rootDomain);
    const allRecords = await cloudflareService.listDNSRecords(zoneId, domain.rootDomain);

    const records = allRecords.filter((r: any) => 
      r.name === domain.fullDomain || r.name.endsWith(`.${domain.fullDomain}`)
    );
    
    res.status(200).json({ records });
  } catch (error) {
    console.error('Fetch records error:', error);
    res.status(500).json({ message: 'Server error fetching records' });
  }
};
