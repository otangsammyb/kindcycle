import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin';
export type SubscriptionPlan = 'free' | 'hacker' | 'founder' | 'agency';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  plan: SubscriptionPlan;
  githubToken?: string;
  avatar?: string;
  company?: string;
  website?: string;
  usage: {
    analysesThisMonth: number;
    totalAnalyses: number;
    lastResetDate: Date;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  campayReference?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plain: string): Promise<boolean>;
  canAnalyze(): boolean;
  incrementUsage(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    plan: {
      type: String,
      enum: ['free', 'hacker', 'founder', 'agency'],
      default: 'free',
    },
    githubToken: { type: String, select: false },
    avatar: String,
    company: String,
    website: String,
    usage: {
      analysesThisMonth: { type: Number, default: 0 },
      totalAnalyses: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    campayReference: String,
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [{ type: String, select: false }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Reset usage counter monthly
UserSchema.pre('save', function (next) {
  const now = new Date();
  const lastReset = this.usage.lastResetDate;
  if (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    this.usage.analysesThisMonth = 0;
    this.usage.lastResetDate = now;
  }
  next();
});

UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.canAnalyze = function (): boolean {
  const planLimits: Record<SubscriptionPlan, number> = {
    free: 1,
    hacker: 1,
    founder: 5,
    agency: Infinity,
  };
  const limit = planLimits[this.plan as SubscriptionPlan];
  return this.usage.analysesThisMonth < limit;
};

UserSchema.methods.incrementUsage = async function (): Promise<void> {
  this.usage.analysesThisMonth += 1;
  this.usage.totalAnalyses += 1;
  await this.save();
};

export const User = mongoose.model<IUser>('User', UserSchema);
