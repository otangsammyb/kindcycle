import mongoose, { Schema, Document } from 'mongoose';

export interface IConfig extends Document {
  key: string;
  value: any;
  description?: string;
  updatedAt: Date;
}

const configSchema = new Schema<IConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
configSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Config = mongoose.model<IConfig>('Config', configSchema);
