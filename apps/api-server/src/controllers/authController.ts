import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from 'shared-models';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

const sendOTP = async (email: string, otp: string, context: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Dhanvatix Auth <service@smtp.dhanvatix.in>',
      to: email,
      subject: `Your Dhanvatix ${context} Code`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #11131A;">Dhanvatix Security</h2>
          <p>You requested a code for <strong>${context}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #2563eb;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send OTP via Resend:', error);
    } else {
      console.log(`OTP sent to ${email} via Resend. ID: ${data?.id}`);
    }
  } catch (err) {
    console.error('Exception while sending OTP via Resend:', err);
  }
};

const isStrongPassword = (password: string) => {
  // At least one uppercase, one lowercase, one number, one special char, min 8 chars
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, firstName, lastName, phoneNumber } = req.body;
    
    if (!email || !password || !username || !firstName || !lastName) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (!isStrongPassword(password)) {
      res.status(400).json({ message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.' });
      return;
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email or username already exists' });
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Create user
    const newUser = new User({
      email,
      passwordHash,
      username,
      firstName,
      lastName,
      phoneNumber,
      name: `${firstName} ${lastName}`,
      oauthProvider: 'local',
      otpCode,
      otpExpiresAt,
      isEmailVerified: false
    });
    
    await newUser.save();
    
    sendOTP(email, otpCode, 'Registration Verification');

    res.status(201).json({ 
      message: 'User registered successfully. Please verify your OTP.', 
      userId: newUser._id,
      requiresOtp: true 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, deviceId } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if the device is trusted and not expired
    if (deviceId && user.trustedDevices) {
      const trustedDevice = user.trustedDevices.find((d: any) => d.deviceId === deviceId);
      if (trustedDevice && trustedDevice.expiresAt > new Date()) {
        // Capture KYC on trusted device login
        try {
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
          let clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
          const userAgent = req.headers['user-agent'] || 'Unknown Device';

          if (clientIp === '::1' || clientIp === '127.0.0.1') {
            try {
              const publicIpRes = await fetch('https://api.ipify.org?format=json');
              const publicIpData = await publicIpRes.json();
              if (publicIpData.ip) clientIp = publicIpData.ip;
            } catch(e) {}
          }

          user.lastIp = clientIp;
          
          try {
            const { UAParser } = await import('ua-parser-js');
            const parser = new UAParser(userAgent);
            const r = parser.getResult();
            let deviceName = userAgent;
            if (r.device.vendor && r.device.model) {
              deviceName = `${r.device.vendor} ${r.device.model}`;
            } else if (r.os.name) {
              deviceName = `${r.os.name} ${r.os.version || ''} - ${r.browser.name || 'Browser'}`;
            }
            user.deviceInfo = deviceName.trim();
          } catch(e) {
            user.deviceInfo = userAgent;
          }

          if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
            const locationRes = await fetch(`http://ip-api.com/json/${clientIp}`);
            if (locationRes.ok) {
              const locData = await locationRes.json();
              if (locData.status === 'success') {
                user.location = {
                  city: locData.city,
                  country: locData.country,
                  lat: locData.lat,
                  lon: locData.lon
                };
              }
            }
          }
          await user.save();
        } catch (kycErr) {
          console.error('Failed to capture KYC data on trusted login:', kycErr);
        }

        // Bypass OTP
        res.status(200).json({ 
          message: 'Login successful via trusted device', 
          userId: user._id,
          requiresOtp: false 
        });
        return;
      }
    }

    const otpCode = generateOTP();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    sendOTP(email, otpCode, 'Login Verification');
    
    res.status(200).json({ 
      message: 'OTP sent for login verification', 
      userId: user._id,
      requiresOtp: true 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp, deviceId, rememberMe } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.otpCode || user.otpCode !== otp) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400).json({ message: 'OTP has expired' });
      return;
    }

    // OTP Valid
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.isEmailVerified = true;

    // Handle remember me (trusted device for 7 days)
    if (rememberMe && deviceId) {
      if (!user.trustedDevices) {
        user.trustedDevices = [];
      }
      // Remove old entry for this device if exists
      user.trustedDevices = user.trustedDevices.filter((d: any) => d.deviceId !== deviceId);
      
      user.trustedDevices.push({
        deviceId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }

    // Capture KYC Security Data
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      let clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || 'Unknown Device';

      if (clientIp === '::1' || clientIp === '127.0.0.1') {
        try {
          const publicIpRes = await fetch('https://api.ipify.org?format=json');
          const publicIpData = await publicIpRes.json();
          if (publicIpData.ip) clientIp = publicIpData.ip;
        } catch(e) {}
      }

      user.lastIp = clientIp;

      try {
        const { UAParser } = await import('ua-parser-js');
        const parser = new UAParser(userAgent);
        const r = parser.getResult();
        let deviceName = userAgent;
        if (r.device.vendor && r.device.model) {
          deviceName = `${r.device.vendor} ${r.device.model}`;
        } else if (r.os.name) {
          deviceName = `${r.os.name} ${r.os.version || ''} - ${r.browser.name || 'Browser'}`;
        }
        user.deviceInfo = deviceName.trim();
      } catch(e) {
        user.deviceInfo = userAgent;
      }

      if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
        const locationRes = await fetch(`http://ip-api.com/json/${clientIp}`);
        if (locationRes.ok) {
          const locData = await locationRes.json();
          if (locData.status === 'success') {
            user.location = {
              city: locData.city,
              country: locData.country,
              lat: locData.lat,
              lon: locData.lon
            };
          }
        }
      }
    } catch (kycErr) {
      console.error('Failed to capture KYC data:', kycErr);
    }

    await user.save();

    res.status(200).json({ 
      message: 'Verification successful', 
      userId: user._id 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// OAuth Stubs
export const googleOAuthStub = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Google OAuth not fully implemented in MVP yet' });
};

export const githubOAuthStub = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'GitHub OAuth not fully implemented in MVP yet' });
};
