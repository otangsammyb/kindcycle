import mongoose from 'mongoose';
import { Analysis } from './src/models/Analysis';
import { generatePDF } from './src/services/export/pdfGenerator';
import { generatePPTX } from './src/services/export/pptxGenerator';
import { config } from './src/config/env';

const run = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log("Connected to MongoDB.");
        
        const latestAnalysis = await Analysis.findOne({ status: 'completed' }).sort('-createdAt');
        if (!latestAnalysis) {
            console.log("No completed analysis found.");
            process.exit(1);
        }
        
        console.log("Testing PREMIUM PDF Generator (WhiteLabel: TRUE)...");
        const pdfFile = await generatePDF(latestAnalysis, 'startup', true);
        console.log("PDF SUCCESS! Filename:", pdfFile);
        
        console.log("Testing PREMIUM PPTX Generator (WhiteLabel: TRUE)...");
        const pptxFile = await generatePPTX(latestAnalysis, 'startup', true);
        console.log("PPTX SUCCESS! Filename:", pptxFile);

    } catch(err) {
        console.error("FATAL EXPORT ERROR:", err);
    }
    process.exit(0);
};

run();
