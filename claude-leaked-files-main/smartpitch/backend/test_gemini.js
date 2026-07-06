require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We can just fetch via REST to be 100% sure what the API sees
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data.models.map(m =>({name: m.name, supportedMethods: m.supportedGenerationMethods})), null, 2));
    } catch(err) {
        console.error("Error", err);
    }
}
listModels();
