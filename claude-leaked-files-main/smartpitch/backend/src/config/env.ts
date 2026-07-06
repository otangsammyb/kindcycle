import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smartpitch',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  github: {
    token: process.env.GITHUB_TOKEN || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceIds: {
      hacker: process.env.STRIPE_HACKER_PRICE_ID || '',
      founder: process.env.STRIPE_FOUNDER_PRICE_ID || '',
      agency: process.env.STRIPE_AGENCY_PRICE_ID || '',
    },
  },

  campay: {
    username: process.env.CAMPAY_APP_USERNAME || '',
    password: process.env.CAMPAY_APP_PASSWORD || '',
    baseUrl: process.env.CAMPAY_ENVIRONMENT === 'PROD' 
      ? 'https://www.campay.net/api' 
      : 'https://demo.campay.net/api',
    webhookUrl: process.env.CAMPAY_WEBHOOK_URL || '',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'SmartPitch <noreply@smartpitch.io>',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@smartpitch.io',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },

  plans: {
    hacker: {
      name: 'Hacker',
      price: 19,
      projectsPerMonth: 1,
      exports: ['pdf'],
      features: ['standard_ai', 'pdf_export'],
    },
    founder: {
      name: 'Founder',
      price: 49,
      projectsPerMonth: 5,
      exports: ['pdf', 'pptx'],
      features: ['standard_ai', 'pdf_export', 'pptx_export', 'red_team'],
    },
    agency: {
      name: 'Agency',
      price: 149,
      projectsPerMonth: -1, // unlimited
      exports: ['pdf', 'pptx'],
      features: ['priority_ai', 'pdf_export', 'pptx_export', 'red_team', 'white_label', 'priority_context'],
    },
  },
};
