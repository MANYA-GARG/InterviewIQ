import {
  GROQ_DEFAULT_MODEL,
  callGroqChatCompletion,
  extractGroqMessageContent,
} from './groqChat.js';

class AIAdminCopilotService {
  async askCopilot(question, monitoringData) {
    if (!question || !question.trim()) {
      throw new Error('A question is required.');
    }

    const analyticsContext = JSON.stringify(monitoringData || {}, null, 2);

    const systemPrompt = `
You are InterviewIQ Admin Copilot, an AI assistant that helps administrators
monitor and understand the AI-powered interview platform.

Your responsibilities:
- Analyze AI usage, latency, token consumption, success rates, and failures.
- Identify problematic features and potential bottlenecks.
- Explain monitoring data in simple, professional language.
- Give practical and prioritized recommendations.
- Answer questions using the provided monitoring data.

Rules:
1. Use the provided monitoring data as the primary source of truth.
2. Never invent statistics, incidents, costs, or metrics.
3. If data is missing, explicitly mention that it is unavailable.
4. Distinguish facts from assumptions.
5. Do not claim to have access to data that is not provided.
6. Be concise but useful.
7. When recommending an action, explain why it would help.
8. If asked something unrelated to platform monitoring, politely redirect
   the user toward InterviewIQ administration and AI analytics.

Structure your response when appropriate:
- Direct Answer
- Key Findings
- Recommended Actions

You are assisting an administrator, not an interview candidate.
`;

    const userPrompt = `
ADMIN QUESTION:
${question.trim().substring(0, 1500)}

CURRENT INTERVIEWIQ MONITORING DATA:
${analyticsContext.substring(0, 12000)}

Analyze the data and answer the administrator's question.
`;

    const response = await callGroqChatCompletion({
      operation: 'aiAdminCopilot',
      model: GROQ_DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      retries: 2,
      baseDelay: 600,
      timeout: 15000,
    });

    const answer = extractGroqMessageContent(response);

    if (!answer || !answer.trim()) {
      throw new Error('AI Admin Copilot returned an empty response.');
    }

    return answer.trim();
  }
}

export default new AIAdminCopilotService();