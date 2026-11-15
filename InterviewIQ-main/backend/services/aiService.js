import fs from 'fs';
import {
  GROQ_DEFAULT_MODEL,
  callGroqChatCompletion,
  extractGroqMessageContent,
} from '../src/services/groqChat.js';

function simpleResumeSummary(text) {
  // Deterministic, privacy-preserving fallback: extract top 5 sentences and list skills
  const clean = (text || '').replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
  if (!clean) return 'No resume text provided.';
  const sentences = clean.split(/\.\s+/).filter(Boolean);
  const top = sentences.slice(0, 3).join('. ');
  // extract simple skills via common separators
  const skillMatches = (text.match(/\b(JavaScript|React|Node|Express|MongoDB|SQL|Python|Java|Docker|Kubernetes|AWS|HTML|CSS|TypeScript)\b/gi) || []);
  const uniqueSkills = Array.from(new Set(skillMatches)).slice(0, 8);
  return `Summary: ${top}${top.endsWith('.') ? '' : '.'} Skills: ${uniqueSkills.join(', ') || 'N/A'}`;
}

export async function generateResumeSummary(text) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('[generateResumeSummary] GROQ_API_KEY not configured — using fallback');
      return simpleResumeSummary(text);
    }

    const response = await callGroqChatCompletion({
      operation: 'generateResumeSummary',
      model: GROQ_DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a professional resume assistant.' },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      retries: 3,
      baseDelay: 1000,
      timeout: 12000,
    });

    const content = extractGroqMessageContent(response);
    if (content) {
      return content;
    }

    console.warn('[generateResumeSummary] Invalid AI response — using fallback summary');
    return simpleResumeSummary(text);
  } catch (error) {
    console.error('[generateResumeSummary] Groq failed:', error?.message || error);
    return simpleResumeSummary(text);
  }
}

export async function generateAIResponse(prompt) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('[generateAIResponse] GROQ_API_KEY not configured — returning deterministic fallback');
      return `Fallback assistant reply: ${prompt?.toString?.().slice(0, 800) || ''}`;
    }

    const response = await callGroqChatCompletion({
      operation: 'generateAIResponse',
      model: GROQ_DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a professional AI assistant for interview preparation and career guidance.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      retries: 3,
      baseDelay: 1000,
      timeout: 12000,
    });

    const content = extractGroqMessageContent(response);
    if (content) {
      return content;
    }

    console.warn('[generateAIResponse] Invalid AI response, returning fallback');
    return `Fallback assistant reply: ${prompt?.toString?.().slice(0, 800) || ''}`;
  } catch (error) {
    console.error('[generateAIResponse] Groq failed after retries:', error?.message || error);
    return `Fallback assistant reply: ${prompt?.toString?.().slice(0, 800) || ''}`;
  }
}
