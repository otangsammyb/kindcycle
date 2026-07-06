import mongoose from 'mongoose';
import { User } from '../models/User';
import { Config } from '../models/Config';
import { config } from '../config/env';
import logger from './logger';

export const seedAdmin = async () => {
  try {
    const adminEmail = config.admin.email;
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      existingAdmin.role = 'admin';
      existingAdmin.password = config.admin.password;
      await existingAdmin.save();
      logger.info(`✅ Admin user ${adminEmail} updated (role and password synced).`);
      return;
    }

    await User.create({
      name: 'SmartPitch Admin',
      email: adminEmail,
      password: config.admin.password,
      role: 'admin',
      plan: 'agency', // All features enabled
      isEmailVerified: true
    });

    logger.info(`✅ Admin user created: ${adminEmail}`);

    // Seed Initial Configs
    const initialConfigs = [
      { key: 'PLAN_LIMITS', value: { free: 1, hacker: 3, founder: 10, agency: 100 }, description: 'Monthly analysis limits per plan' },
      { key: 'PLAN_PRICES', value: { hacker: 19, founder: 49, agency: 149 }, description: 'Monthly subscription prices in USD' },
      { key: 'STRIPE_ENABLED', value: true, description: 'Enable/Disable Stripe payments' },
      { key: 'CAMPAY_ENABLED', value: true, description: 'Enable/Disable MTN/Orange Money payments' },
      { key: 'AI_PRIMARY_MODEL', value: 'claude-3-5-sonnet-20240620', description: 'Main AI model for analysis' }
    ];

    for (const conf of initialConfigs) {
      await Config.findOneAndUpdate(
        { key: conf.key },
        { $setOnInsert: conf },
        { upsert: true, new: true }
      );
    }
    logger.info('✅ Initial platform configuration seeded.');

  } catch (err) {
    logger.error('❌ Error seeding admin user:', err);
  }
};

// If run directly
if (require.main === module) {
  const runSeed = async () => {
    await mongoose.connect(config.mongoUri);
    await seedAdmin();
    await mongoose.connection.close();
  };
  runSeed();
}
