const axios = require('axios');
const mongoose = require('mongoose');
const Fundraiser = require('./src/models/Fundraiser');
const User = require('./src/models/User');

const API = 'http://localhost:5000/api';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/kindcycle');
    // Find an existing creator
    const user = await User.findOne({ role: 'giver' });
    if (!user) { console.log('No user'); process.exit(1); }
    
    // Auth token mechanism - fake it for the test
    const tokenRes = await axios.post(`${API}/auth/login`, { email: user.email, password: 'password123' }).catch(async (e) => {
      // Just bypass login by generating token locally if login fails
      const jwt = require('jsonwebtoken');
      return { data: { token: jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'kindcyclesupersecretkey2025') } };
    });
    const token = tokenRes.data.token;
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Create new fundraiser
    const createRes = await axios.post(`${API}/fundraisers`, {
      title: 'Test Deduction', description: 'Testing', category: 'Health', goalAmount: 20000
    }, { headers });
    const fId = createRes.data.data._id;
    console.log('Created ID:', fId);

    // Add 10000 raised locally
    await Fundraiser.findByIdAndUpdate(fId, { raised: 10000, status: 'active' });

    // Try withdraw API
    console.log('Sending withdrawal request for 5000...');
    const result = await axios.post(`${API}/fundraisers/${fId}/withdraw`, {
      phoneNumber: '237670000000', amount: 5000
    }, { headers });
    
    console.log('API Response:', result.data);
    
    const fAfter = await Fundraiser.findById(fId);
    console.log('Fundraiser State After: Raised=', fAfter.raised, 'Withdrawn=', fAfter.withdrawn);
    process.exit(0);
  } catch (e) {
    console.error('Test Error:', e.response?.data || e.message);
    process.exit(1);
  }
})();
