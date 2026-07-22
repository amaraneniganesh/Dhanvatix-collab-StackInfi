import mongoose, { Schema, Document } from 'mongoose';

export interface IDomain extends Document {
  userId: mongoose.Types.ObjectId;
  subdomain: string;
  rootDomain: string;
  fullDomain: string;
  cloudflareZoneId?: string;
  status: 'Pending' | 'Awaiting Verification' | 'Verified' | 'Failed' | 'Suspended' | 'Deleted';
  verificationCode?: string;
  dnsRecordsBackup?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subdomain: { type: String, required: true },
    rootDomain: { type: String, required: true },
    fullDomain: { type: String, required: true, unique: true },
    cloudflareZoneId: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Awaiting Verification', 'Verified', 'Failed', 'Suspended', 'Deleted'],
      default: 'Pending',
    },
    verificationCode: { type: String, unique: true, sparse: true },
    dnsRecordsBackup: { type: [Schema.Types.Mixed], default: undefined },
  },
  { timestamps: true }
);

export const Domain = mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);
