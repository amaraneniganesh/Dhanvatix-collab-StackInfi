import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from 'shared-models';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const user = await User.findById(userId).select('-passwordHash -otpCode -otpExpiresAt');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, firstName, lastName, phoneNumber, profilePicture } = req.body;
    
    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Only update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (firstName && lastName) user.name = `${firstName} ${lastName}`;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (profilePicture) user.profilePicture = profilePicture; // Base64 handling

    await user.save();

    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const otpCode = generateOTP();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Send OTP via Resend
    try {
      await resend.emails.send({
        from: 'Dhanvatix Auth <service@smtp.dhanvatix.in>',
        to: user.email,
        subject: `Your Dhanvatix Password Reset Code`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #11131A;">Dhanvatix Security</h2>
            <p>You requested a password change.</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #2563eb;">${otpCode}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please secure your account immediately.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('Resend fail:', e);
    }

    res.status(200).json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error requesting password reset' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      res.status(400).json({ message: 'userId, otp, and newPassword are required' });
      return;
    }

    // Validate strong password
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(newPassword)) {
      res.status(400).json({ message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.' });
      return;
    }

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

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error resetting password' });
  }
};
