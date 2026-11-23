import AIUsageLog from '../models/AIUsageLog.js';

const sanitizeError = (error) => {
  const message = String(error?.message || 'Unknown AI error');

  // Avoid storing credentials, tokens, or excessively long error messages
  return message
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/(api[_-]?key|token|secret)\s*[:=]\s*[^\s&]+/gi, '$1=[REDACTED]')
    .slice(0, 500);
};

/**
 * Records AI usage without allowing logging failures
 * to interrupt the application's main functionality.
 */
export const logAIUsage = async ({
  userId = null,
  feature = 'other',
  provider = 'groq',
  model = '',
  status = 'success',
  latencyMs = 0,
  tokens = {},
  error = null,
  metadata = {},
} = {}) => {
  try {
    await AIUsageLog.create({
      user: userId || undefined,
      feature,
      provider,
      model,
      status,
      latencyMs: Math.max(0, Number(latencyMs) || 0),
      tokens: {
        prompt: Math.max(0, Number(tokens.prompt) || 0),
        completion: Math.max(0, Number(tokens.completion) || 0),
        total: Math.max(0, Number(tokens.total) || 0),
      },
      errorCode: error?.code ? String(error.code).slice(0, 100) : undefined,
      errorMessage: error ? sanitizeError(error) : undefined,
      metadata,
    });
  } catch (loggingError) {
    // Monitoring must never break interview functionality
    console.error('[AIUsageLogger] Failed to persist usage log:', loggingError.message);
  }
};

/**
 * Extract token usage from provider responses.
 * Supports common Groq/OpenAI-compatible response formats.
 */
export const extractTokenUsage = (response) => {
  const usage = response?.usage || response?.data?.usage || {};

  const prompt = Number(
    usage.prompt_tokens ?? usage.input_tokens ?? 0
  );

  const completion = Number(
    usage.completion_tokens ?? usage.output_tokens ?? 0
  );

  const total = Number(
    usage.total_tokens ?? prompt + completion
  );

  return {
    prompt: Math.max(0, prompt || 0),
    completion: Math.max(0, completion || 0),
    total: Math.max(0, total || 0),
  };
};

export default { logAIUsage, extractTokenUsage };