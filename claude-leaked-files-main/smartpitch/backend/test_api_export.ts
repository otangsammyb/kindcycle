import axios from 'axios';
import mongoose from 'mongoose';
import { User } from './src/models/User';
import { Analysis } from './src/models/Analysis';
import { config } from './src/config/env';
import { signAccessToken } from './src/utils/jwt';

const test = async () => {
    await mongoose.connect(config.mongoUri);
    
    const analysis = await Analysis.findOne({ status: 'completed' }).sort('-createdAt');
    const user = await User.findById(analysis.userId);
    
    const token = signAccessToken({ id: user._id.toString(), role: user.role, plan: user.plan });
    
    try {
        const res = await axios.post('http://localhost:5000/api/export', {
            analysisId: analysis._id.toString(),
            type: 'pdf',
            style: 'startup'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS:", res.data);
    } catch(err: any) {
        console.error("ERROR:");
        console.error(err.response?.data || err.message);
    }
    process.exit(0);
};
test();
