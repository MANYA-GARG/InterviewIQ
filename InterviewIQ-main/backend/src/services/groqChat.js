import { getOpenAIClient } from '../config/openai.js';
import AppError from '../utils/AppError.js';

export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

const SUPPORTED_GROQ_MODELS = new Set([
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'qwen/qwen3-32b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'groq/compound',
  'groq/compound-mini',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
]);

const MODEL_FALLBACK_CHAIN = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'llama-3.3-70b-versatile',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const normalizeGroqModel = (model) => {
  if (SUPPORTED_GROQ_MODELS.has(model)) {
    return model;
  }

  return GROQ_DEFAULT_MODEL;
};

export const getGroqClient = () => getOpenAIClient();

export const extractGroqMessageContent = (response) => {
  return response?.choices?.[0]?.message?.content?.trim() || '';
};

export const parseGroqJsonContent = (content) => {
  const trimmed = String(content || '').trim();

  try {
    return JSON.parse(trimmed);
  } catch (parseError) {
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    const objectMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    throw parseError;
  }
};

export const callGroqChatCompletion = async ({
  operation,
  model,
  messages,
  temperature,
  max_tokens,
  retries = 3,
  baseDelay = 500,
  timeout = 15000,
}) => {
  const client = getGroqClient();

  if (!client) {
    throw new AppError('Groq API is not configured', 503);
  }

  let normalizedModel = normalizeGroqModel(model);
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const startedAt = Date.now();

    console.log('Calling Groq API...');
    console.log('Model Used:', normalizedModel);
    console.log('Endpoint:', GROQ_ENDPOINT);
    console.log('[Groq Request Meta]', {
      operation,
      attempt,
      messageCount: Array.isArray(messages) ? messages.length : 0,
      temperature,
      max_tokens,
    });

    try {
      const response = await Promise.race([
        client.chat.completions.create({
          model: normalizedModel,
          messages,
          temperature,
          max_tokens,
        }),
        sleep(timeout).then(() => {
          throw new Error(`Groq request timed out after ${timeout}ms`);
        }),
      ]);

      const tokenUsage = response?.usage
        ? {
            prompt: response.usage.prompt_tokens || 0,
            completion: response.usage.completion_tokens || 0,
            total: response.usage.total_tokens || 0,
          }
        : null;
      const responseTimeMs = Date.now() - startedAt;

      console.log('Groq Response Received');
      console.log('Tokens Used:', tokenUsage);
      console.log('Response Time:', `${responseTimeMs}ms`);
      console.log('[Groq Response Meta]', {
        operation,
        model: normalizedModel,
      });

      return response;
    } catch (error) {
      lastError = error;

      console.error(`[${operation}] Groq request failed`, {
        attempt,
        model: normalizedModel,
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        data: error?.response?.data,
        stack: error?.stack,
      });

      if (String(error?.code || '').toLowerCase() === 'model_decommissioned') {
        const nextModel = MODEL_FALLBACK_CHAIN.find(
          (candidate) => candidate !== normalizedModel
        );

        if (nextModel) {
          console.warn(`[${operation}] Switching model due to deprecation: ${normalizedModel} -> ${nextModel}`);
          normalizedModel = nextModel;
        }
      }

      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`[${operation}] Retrying Groq request after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};
