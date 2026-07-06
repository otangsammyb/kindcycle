import mongoose from 'mongoose';
import { User } from './src/models/User';
import { config } from './src/config/env';

const seed = async () => {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to DB');
  
  // Check if exists
  let founder = await User.findOne({ email: 'founder@smartpitch.ai' });
  if (!founder) {
    founder = await User.create({
      name: 'Test Founder',
      email: 'founder@smartpitch.ai',
      password: 'password123',
      role: 'admin',
      plan: 'agency'
    });
    console.log('Created superuser founder@smartpitch.ai');
  } else {
      founder.plan = 'agency';
      founder.role = 'admin';
      await founder.save();
      console.log('Updated superuser founder@smartpitch.ai');
  }
  
  process.exit(0);
};

seed();
