import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: 'stripe' | 'campay_mtn' | 'campay_orange';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  plan: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  campayReference?: string;
  campayTransactionId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    method: {
      type: String,
      enum: ['stripe', 'campay_mtn', 'campay_orange'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    plan: { type: String, required: true },
    stripePaymentIntentId: String,
    stripeSessionId: String,
    campayReference: String,
    campayTransactionId: String,
    description: { type: String, required: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
