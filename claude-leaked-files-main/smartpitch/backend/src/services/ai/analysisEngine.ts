import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { Response } from 'express';
import { Analysis } from '../../models/Analysis';
import mongoose from 'mongoose';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

const genAI = new GoogleGenerativeAI(config.gemini.apiKey || '');

export const analyzeRepoStream = async (
  userId: string,
  repoData: { repoName: string; description: string; language: string; tree: string; files: { path: string; content: string }[] },
  mode: 'standard' | 'red_team',
  res: Response
) => {
  try {
    const analysisId = new mongoose.Types.ObjectId();
    
    // Save initial pending status
    const analysisRecord = await Analysis.create({
      _id: analysisId,
      userId,
      repoUrl: `https://github.com/${repoData.repoName}`,
      repoName: repoData.repoName,
      repoDescription: repoData.description,
      language: repoData.language,
      mode,
      status: 'processing'
    });

    let systemPrompt = `You are a world-class venture capitalist, software architect, and startup pitch expert.
Your goal is to analyze the provided GitHub repository for the project "${repoData.repoName}" (${repoData.description}) and generate a comprehensive pitch deck and technical analysis.

The analysis MUST be output in valid JSON format ONLY matching the following schema. Do NOT output markdown or any other text before or after the JSON.

CRITICAL TEXT CONSTRAINTS:
- ABSOLUTELY NO EMOJIS (No icons, no graphical symbols).
- ABSOLUTELY NO MARKDOWN STYLING (No **, no *, no \`, no #, no >).
- DO NOT USE ASTERISKS (*) FOR ANY PURPOSE.
- STRUCTURE: Use newlines (\\n) and dashes (- ) to create clear, vertical bulleted lists for readability.
- The output text must be professional, alphanumeric, and highly structured for a premium slide deck export.
- Standard punctuation (. , ? !) is encouraged. Avoid strange symbols like = + _ ~ *.

Schema:
{
  "executiveSummary": "string",
  "problemStatement": "string",
  "solution": "string",
  "marketOpportunity": "string",
  "techAnalysis": "string",
  "businessModel": "string",
  "competitiveAdvantage": "string",
  "risks": ["string"],
  "pitchSlides": [
    {
      "type": "string (one of: cover, problem, solution, market, tech, business, team, financials, cta)",
      "title": "string",
      "content": "string",
      "speakerNotes": "string"
    }
  ],
  "score": { "overall": number, "technical": number, "marketFit": number, "innovation": number, "investability": number }
}`;

    if (mode === 'red_team') {
      systemPrompt += `\n\nAdditionally, since this is in 'red_team' mode, you must act as a skeptical, hard-hitting tier-1 investor.
You must include an 'investorChallenges' array in your JSON output.
Schema extension:
"investorChallenges": [
  { "question": "string (the hard question)", "suggestedAnswer": "string (how the founder should reply)", "difficulty": "hard" }
]`;
    }

    const fileContext = repoData.files.map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n');
    const promptContext = `
Project Name: ${repoData.repoName}
Language: ${repoData.language}
Description: ${repoData.description}

File Tree:
${repoData.tree}

Selected Files:
${fileContext}
    `;

    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ event: 'started', analysisId })}\n\n`);

    let fullJsonString = '';

    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: promptContext }],
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullJsonString += text;
          res.write(`data: ${JSON.stringify({ event: 'chunk', text })}\n\n`);
        }
      }
    } catch (anthropicError) {
      console.warn("Anthropic failed, falling back to Gemini...");
      if (!config.gemini.apiKey) {
        throw new Error("Anthropic failed and no Gemini API Key is configured.");
      }

      // Gemini Fallback
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: systemPrompt });
      const result = await model.generateContentStream(promptContext);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullJsonString += text;
        res.write(`data: ${JSON.stringify({ event: 'chunk', text })}\n\n`);
      }
    }

    // Try parsing the json
    try {
      // Find JSON boundaries just in case Claude added markdown wrappers
      const jsonStart = fullJsonString.indexOf('{');
      const jsonEnd = fullJsonString.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        // Strip markdown bolding signals if AI slipped up
        const cleanJson = fullJsonString.substring(jsonStart, jsonEnd + 1).replace(/\*\*/g, '');
        const parsedData = JSON.parse(cleanJson);
        
        analysisRecord.result = parsedData;
        analysisRecord.status = 'completed';
        await analysisRecord.save();

        res.write(`data: ${JSON.stringify({ event: 'completed', data: parsedData })}\n\n`);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      analysisRecord.status = 'failed';
      analysisRecord.errorMessage = 'Failed to parse AI output into structured format.';
      await analysisRecord.save();
      res.write(`data: ${JSON.stringify({ event: 'error', message: 'Analysis failed formatting check' })}\n\n`);
    }

    res.write('event: close\ndata: \n\n');
    res.end();

  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ event: 'error', message: err.message })}\n\n`);
    res.write('event: close\ndata: \n\n');
    res.end();
  }
};
