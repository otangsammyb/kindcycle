require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Item = require('../models/Item');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing data
  await User.deleteMany();
  await Item.deleteMany();

  // Create admin
  const admin = await User.create({
    name: 'KindCycle Admin',
    email: 'admin@kindcycle.org',
    password: 'Admin@1234',
    role: 'admin',
    idVerified: true,
    isActive: true,
    trustScore: 100,
  });

  // Create givers
  const giver1 = await User.create({
    name: 'Sophie Martin',
    email: 'sophie@example.com',
    password: 'Password@1',
    role: 'giver',
    idVerified: true,
    bio: 'I love giving back to the community.',
    phone: '+237600000001',
    location: { type: 'Point', coordinates: [9.7085, 4.0511], city: 'Douala', country: 'Cameroon' },
    trustScore: 85,
    reviewCount: 12,
  });

  const giver2 = await User.create({
    name: 'Jean-Pierre Kamga',
    email: 'jp@example.com',
    password: 'Password@1',
    role: 'giver',
    idVerified: true,
    phone: '+237600000002',
    location: { type: 'Point', coordinates: [11.5174, 3.848], city: 'Yaoundé', country: 'Cameroon' },
    trustScore: 72,
    reviewCount: 8,
  });

  // Create receivers
  const receiver1 = await User.create({
    name: 'Marie Nkolo',
    email: 'marie@example.com',
    password: 'Password@1',
    role: 'receiver',
    idVerified: true,
    phone: '+237600000003',
    location: { type: 'Point', coordinates: [9.7085, 4.0511], city: 'Douala', country: 'Cameroon' },
    trustScore: 60,
  });

  // Create sample items
  const categories = ['Clothing', 'Electronics', 'Furniture', 'Books', 'Toys', 'Food', 'School Supplies'];
  const conditions = ['new', 'like_new', 'good', 'fair'];
  const deliveryMethods = ['pickup', 'delivery', 'both'];

  const itemsData = [
    { title: 'Winter Jacket (Size M)', description: 'Warm winter jacket, barely worn. Great for cold weather.', category: 'Clothing', condition: 'like_new' },
    { title: 'English Grammar Textbook', description: 'Complete English grammar book, perfect for secondary school students.', category: 'Books', condition: 'good' },
    { title: 'Wooden Chair', description: 'Solid wooden chair, slight scratch on one leg but fully functional.', category: 'Furniture', condition: 'fair' },
    { title: 'Children\'s Toys Bundle', description: 'Collection of educational toys for ages 3-8. All clean and safe.', category: 'Toys', condition: 'good' },
    { title: 'Old Laptop (Working)', description: 'Dell laptop, Windows 10, 4GB RAM. Perfect for school work.', category: 'Electronics', condition: 'fair' },
    { title: 'Rice (10kg bag)', description: 'Unopened bag of high-quality rice.', category: 'Food', condition: 'new' },
    { title: 'School Backpack', description: 'Like-new backpack with multiple compartments.', category: 'School Supplies', condition: 'like_new' },
    { title: 'Baby Clothes Bundle', description: 'Assorted baby clothes, sizes 0-12 months. All washed and clean.', category: 'Baby & Kids', condition: 'good' },
  ];

  for (let i = 0; i < itemsData.length; i++) {
    const giver = i % 2 === 0 ? giver1 : giver2;
    await Item.create({
      ...itemsData[i],
      giver: giver._id,
      deliveryMethod: deliveryMethods[i % 3],
      status: 'approved',
      approvedAt: new Date(),
      location: giver.location,
      viewCount: Math.floor(Math.random() * 100),
      requestCount: Math.floor(Math.random() * 10),
    });
  }

  console.log('\n✅ Seed completed!');
  console.log('📧 Admin: admin@kindcycle.org / Admin@1234');
  console.log('📧 Giver: sophie@example.com / Password@1');
  console.log('📧 Receiver: marie@example.com / Password@1');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
