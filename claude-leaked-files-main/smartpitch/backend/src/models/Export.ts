import mongoose, { Document, Schema } from 'mongoose';

export interface IExport extends Document {
  userId: mongoose.Types.ObjectId;
  analysisId: mongoose.Types.ObjectId;
  type: 'pdf' | 'pptx';
  style: 'corporate' | 'startup' | 'technical' | 'minimal' | 'bold';
  fileName: string;
  filePath: string;
  fileSize: number;
  whiteLabel: boolean;
  downloadCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

const ExportSchema = new Schema<IExport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis', required: true },
    type: { type: String, enum: ['pdf', 'pptx'], required: true },
    style: {
      type: String,
      enum: ['corporate', 'startup', 'technical', 'minimal', 'bold'],
      default: 'startup',
    },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    whiteLabel: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
    expiresAt: Date,
  },
  { timestamps: true }
);

export const Export = mongoose.model<IExport>('Export', ExportSchema);
