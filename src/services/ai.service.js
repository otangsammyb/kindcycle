/**
 * AI Need Detection Service — Architectural Hook
 * Replace this stub with a real ML model (e.g., TensorFlow.js, OpenAI API)
 */
const analyzeItemNeed = async (item) => {
  console.log(`[AI Hook] Analyzing need score for item: ${item._id} - "${item.title}"`);
  // TODO: Call your ML model or API here
  // Example: const score = await openai.classify(item.description);
  const mockScore = Math.random(); // placeholder
  await require('../models/Item').findByIdAndUpdate(item._id, { aiMatchScore: mockScore });
  return { score: mockScore, confidence: 'low', source: 'stub' };
};

const detectNeedFromProfile = async (user) => {
  console.log(`[AI Hook] Need detection for user: ${user._id}`);
  // TODO: Analyze user's request history and location data
  return { needScore: 0.5, categories: ['Clothing', 'Food'], source: 'stub' };
};

module.exports = { analyzeItemNeed, detectNeedFromProfile };
