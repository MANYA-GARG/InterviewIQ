import OpenAI from 'openai';

let openaiClient = null;

export const getOpenAIClient = () => {
  if (!openaiClient && process.env.GROQ_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return openaiClient;
};

export default { getOpenAIClient };
