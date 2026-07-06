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
        
        console.log("Testing PDF Generator on Analysis ID:", latestAnalysis._id.toString());
        const pdfFile = await generatePDF(latestAnalysis, 'startup');
        console.log("PDF SUCCESS! Filename:", pdfFile);
        
        console.log("Testing PPTX Generator...");
        const pptxFile = await generatePPTX(latestAnalysis, 'startup');
        console.log("PPTX SUCCESS! Filename:", pptxFile);

    } catch(err) {
        console.error("FATAL EXPORT ERROR:", err);
    }
    process.exit(0);
};

run();
