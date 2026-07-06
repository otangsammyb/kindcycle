import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  repoUrl: string;
  repoName: string;
  repoDescription?: string;
  language?: string;
  techStack: string[];
  projectType: string; // 'saas', 'mobile', 'api', 'library', 'ml', 'web', 'other'
  mode: 'standard' | 'red_team';
  result: {
    executiveSummary: string;
    problemStatement: string;
    solution: string;
    marketOpportunity: string;
    techAnalysis: string;
    businessModel: string;
    competitiveAdvantage: string;
    risks: string[];
    investorChallenges?: InvestorChallenge[];
    pitchSlides: PitchSlide[];
    score: AnalysisScore;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  tokensUsed: number;
  processingTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestorChallenge {
  question: string;
  suggestedAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PitchSlide {
  title: string;
  content: string;
  speakerNotes?: string;
  type: 'cover' | 'problem' | 'solution' | 'market' | 'tech' | 'business' | 'team' | 'financials' | 'cta';
  style?: string;
}

export interface AnalysisScore {
  overall: number;
  technical: number;
  marketFit: number;
  innovation: number;
  investability: number;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    repoUrl: { type: String, required: true },
    repoName: { type: String, required: true },
    repoDescription: String,
    language: String,
    techStack: [String],
    projectType: { type: String, default: 'other' },
    mode: { type: String, enum: ['standard', 'red_team'], default: 'standard' },
    result: {
      executiveSummary: String,
      problemStatement: String,
      solution: String,
      marketOpportunity: String,
      techAnalysis: String,
      businessModel: String,
      competitiveAdvantage: String,
      risks: [String],
      investorChallenges: [
        {
          question: String,
          suggestedAnswer: String,
          difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        },
      ],
      pitchSlides: [
        {
          title: String,
          content: String,
          speakerNotes: String,
          type: { type: String },
          style: String,
        },
      ],
      score: {
        overall: Number,
        technical: Number,
        marketFit: Number,
        innovation: Number,
        investability: Number,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: String,
    tokensUsed: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AnalysisSchema.index({ userId: 1, createdAt: -1 });

export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
