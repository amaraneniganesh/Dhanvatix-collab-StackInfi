import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  oauthProvider: 'google' | 'github' | 'local';
  oauthId?: string;
  name: string; // Keep legacy name for backward compatibility if needed, or compute it
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  isEmailVerified: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastIp?: string;
  deviceInfo?: string;
  location?: {
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  trustedDevices?: {
    deviceId: string;
    expiresAt: Date;
  }[];
  domainLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String },
    profilePicture: { type: String },
    oauthProvider: { type: String, enum: ['google', 'github', 'local'], default: 'local' },
    oauthId: { type: String },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    isEmailVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    lastIp: { type: String },
    deviceInfo: { type: String },
    location: {
      city: { type: String },
      country: { type: String },
      lat: { type: Number },
      lon: { type: Number }
    },
    trustedDevices: [
      {
        deviceId: { type: String },
        expiresAt: { type: Date }
      }
    ],
    domainLimit: { type: Number, default: 2 }
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
