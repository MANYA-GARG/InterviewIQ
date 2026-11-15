import fs from 'fs';
import {
  GROQ_DEFAULT_MODEL,
  callGroqChatCompletion,
  extractGroqMessageContent,
  parseGroqJsonContent,
} from './groqChat.js';

class AIService {
  // Generic retry with exponential backoff AND timeout
  async _retry(fn, retries = 3, baseDelay = 500, timeout = 15000) {
    let lastErr;
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[ai._retry] Attempt ${i + 1}/${retries}`, { timeout });
        
        // Wrap function call with timeout
        const result = await Promise.race([
          fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`API request timeout after ${timeout}ms`)), timeout)
          )
        ]);
        
        console.log(`[ai._retry] Success on attempt ${i + 1}`);
        return result;
      } catch (err) {
        lastErr = err;
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`[ai._retry] Attempt ${i + 1} failed, retrying after ${delay}ms`, {
          error: err.message || err,
          remainingRetries: retries - i - 1
        });
        
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    
    console.error(`[ai._retry] All ${retries} attempts failed`, { 
      error: lastErr?.message || lastErr 
    });
    throw lastErr;
  }

  // Simple keyword-based fallback evaluation when AI fails
  _fallbackEvaluateAnswer(question, answer, expectedAnswer = '') {
    const text = (answer || '').toString().toLowerCase();
    const expected = (expectedAnswer || '').toString().toLowerCase();

    // Collect keywords from expected answer
    const keywords = expected.split(/[^a-z0-9]+/).filter(Boolean);

    let matched = 0;
    if (keywords.length > 0) {
      keywords.forEach((kw) => {
        if (text.includes(kw)) matched++;
      });
    }

    // Heuristic if no expected keywords: use length and presence of technical words
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const technicalSignals = ['error', 'algorithm', 'complexity', 'optimize', 'architecture', 'cache', 'async', 'api', 'database', 'sql', 'node', 'react'];
    const techMatches = technicalSignals.filter((t) => text.includes(t)).length;

    let score = 5;
    if (keywords.length > 0) {
      score = Math.round((matched / keywords.length) * 10);
    } else {
      score = Math.min(10, Math.round(Math.min(10, (wordCount / 50) * 6 + techMatches)));
    }

    // Ensure bounds
    score = Math.max(0, Math.min(10, score));

    const strengths = [];
    const improvements = [];
    if (techMatches > 0) strengths.push('Used some relevant technical terms');
    if (wordCount > 40) strengths.push('Provided detailed answer');
    if (matched > 0) strengths.push('Covered expected points');
    if (strengths.length === 0) strengths.push('Provided an answer');

    if (matched === 0 && wordCount < 20) improvements.push('Provide more depth and examples');
    if (matched === 0 && keywords.length > 0) improvements.push('Mention key concepts related to the expected answer');

    const feedback = `Auto-evaluated: score ${score}/10. ${strengths.join(', ')}. ${improvements.join(' ')}`.trim();

    return {
      score,
      feedback,
      strengths,
      improvements,
    };
  }
  generateFallbackQuestions(jobRole, experienceLevel, numberOfQuestions) {
    // Try loading a structured question bank from disk if available
    try {
      const dataPath = new URL('../data/questionBank.json', import.meta.url);
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const bank = JSON.parse(raw);
        const roleKey = Object.keys(bank).find(k => k.toLowerCase() === (jobRole || '').toLowerCase()) || jobRole;
        const levelKey = (experienceLevel || 'fresher').toLowerCase();
        const levelMap = { fresher: 'fresher', junior: 'junior', experienced: 'experienced', intermediate: 'junior' };
        const selectedLevel = levelMap[levelKey] || 'fresher';
        const candidates = (bank[roleKey] && bank[roleKey][selectedLevel]) || [];
        if (Array.isArray(candidates) && candidates.length > 0) {
          return candidates.slice(0, Math.max(3, Math.min(numberOfQuestions || 5, candidates.length)));
        }
      }
    } catch (err) {
      console.warn('[ai.generateFallbackQuestions] failed loading question bank', err?.message || err);
    }

    const baseQuestions = [
      {
        questionText: `Introduce yourself and explain your experience relevant to a ${jobRole} role.`,
        category: 'general',
        difficulty: 'easy',
        expectedAnswer: 'Brief background, relevant projects, and role fit.',
      },
      {
        questionText: `What are the key responsibilities of a ${jobRole}, and how would you prioritize them in your first 90 days?`,
        category: 'behavioral',
        difficulty: 'medium',
        expectedAnswer: 'Prioritization, planning, and measurable goals.',
      },
      {
        questionText: `Describe a challenging technical problem you solved and the approach you followed.`,
        category: 'technical',
        difficulty: 'medium',
        expectedAnswer: 'Problem statement, tradeoffs, solution, and impact.',
      },
      {
        questionText: `How do you ensure code quality, testing, and maintainability in team projects?`,
        category: 'technical',
        difficulty: 'medium',
        expectedAnswer: 'Testing strategy, reviews, standards, and CI/CD.',
      },
      {
        questionText: `Tell me about a time you handled conflicting priorities or tight deadlines.`,
        category: 'behavioral',
        difficulty: 'medium',
        expectedAnswer: 'Communication, prioritization, and outcome.',
      },
      {
        questionText: `How would you design and scale a feature used by thousands of concurrent users?`,
        category: 'scenario-based',
        difficulty: 'hard',
        expectedAnswer: 'Architecture, scalability concerns, caching, and observability.',
      },
    ];

    const adjusted = baseQuestions.map((q) => {
      if (experienceLevel === 'fresher') {
        return { ...q, difficulty: q.difficulty === 'hard' ? 'medium' : q.difficulty };
      }
      if (experienceLevel === 'experienced' && q.difficulty === 'medium') {
        return { ...q, difficulty: 'hard' };
      }
      return q;
    });

    return adjusted.slice(0, Math.max(3, Math.min(numberOfQuestions || 5, adjusted.length)));
  }

  async generateInterviewQuestions(jobRole, experienceLevel, numberOfQuestions, resumeText = '') {
    try {
      const prompt = `You are an expert technical interviewer. Generate ${numberOfQuestions} interview questions for a ${jobRole} position at ${experienceLevel} level.

${resumeText ? `Candidate's Resume Context:\n${resumeText.substring(0, 1000)}\n\n` : ''}

Requirements:
1. Generate exactly ${numberOfQuestions} questions
2. Mix of technical, behavioral, and scenario-based questions
3. Appropriate difficulty for ${experienceLevel} level
4. Questions should be relevant to ${jobRole}
5. Each question should have a category and difficulty level

Return a JSON array with this structure:
[
  {
    "questionText": "question here",
    "category": "technical|behavioral|scenario-based|general",
    "difficulty": "easy|medium|hard",
    "expectedAnswer": "brief expected answer points"
  }
]

Return ONLY the JSON array, no additional text.`;

      const response = await callGroqChatCompletion({
        operation: 'generateInterviewQuestions',
        model: GROQ_DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        retries: 3,
        baseDelay: 600,
        timeout: 12000,
      });

      const content = extractGroqMessageContent(response);
      
      // Parse JSON response
      let questions;
      try {
        questions = parseGroqJsonContent(content);
      } catch (parseError) {
        throw parseError;
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        console.warn('[ai.generateInterviewQuestions] Empty AI response, using fallback questions');
        return this.generateFallbackQuestions(jobRole, experienceLevel, numberOfQuestions);
      }

      console.log('[ai.generateInterviewQuestions] Successfully generated questions', {
        count: questions.length
      });

      return questions.slice(0, numberOfQuestions);
    } catch (error) {
      console.error('[ai.generateInterviewQuestions] Failed, using fallback:', error?.message || error);
      return this.generateFallbackQuestions(jobRole, experienceLevel, numberOfQuestions);
    }
  }

  async evaluateAnswer(question, answer, expectedAnswer = '') {
    // Wrap AI call with retry and fallback
    try {
      const prompt = `Evaluate this interview answer on a scale of 0-10.\n\nQuestion: ${question}\n${expectedAnswer ? `Expected Answer Points: ${expectedAnswer}\\n` : ''}Candidate's Answer: ${answer}\n\nProvide evaluation in this JSON format:{\n  "score": 0-10,\n  "feedback": "detailed feedback on the answer",\n  "strengths": ["strength 1", "strength 2"],\n  "improvements": ["improvement 1", "improvement 2"]\n}\n\nReturn ONLY the JSON object, no additional text.`;

      const response = await callGroqChatCompletion({
        operation: 'evaluateAnswer',
        model: GROQ_DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert interviewer evaluating candidate answers. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
        retries: 3,
        baseDelay: 600,
        timeout: 10000,
      });

      const content = extractGroqMessageContent(response);
      let evaluation = parseGroqJsonContent(content);

      // Ensure required fields
      evaluation.score = Number(evaluation.score) || 0;
      evaluation.feedback = evaluation.feedback || '';
      evaluation.strengths = evaluation.strengths || [];
      evaluation.improvements = evaluation.improvements || [];

      return evaluation;
    } catch (error) {
      console.error('[ai.evaluateAnswer] AI Evaluation Error (fallback):', error?.message || error);
      // Use fallback heuristic instead of throwing
      return this._fallbackEvaluateAnswer(question, answer, expectedAnswer);
    }
  }

  async generateOverallFeedback(evaluations, jobRole, experienceLevel) {
    // Try generating overall feedback via AI with retry; fallback to heuristic
    try {
      const prompt = `Based on these interview question evaluations for a ${jobRole} position at ${experienceLevel} level, provide comprehensive overall feedback.\n\nEvaluations:\n${JSON.stringify(evaluations, null, 2)}\n\nProvide feedback in this JSON format:{\n  "overallScore": 0-100,\n  "categoryScores": {\n    "technical": 0-100,\n    "communication": 0-100,\n    "problemSolving": 0-100,\n    "confidence": 0-100\n  },\n  "strengths": ["strength 1", "strength 2", "strength 3"],\n  "improvements": ["improvement 1", "improvement 2", "improvement 3"],\n  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]\n}\n\nReturn ONLY the JSON object, no additional text.`;

      const response = await callGroqChatCompletion({
        operation: 'generateOverallFeedback',
        model: GROQ_DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert interviewer providing comprehensive feedback. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
        retries: 3,
        baseDelay: 800,
        timeout: 12000,
      });

      const content = extractGroqMessageContent(response);
      const feedback = parseGroqJsonContent(content);

      return feedback;
    } catch (error) {
      console.error('[ai.generateOverallFeedback] AI Feedback Error (fallback):', error?.message || error);

      // Heuristic fallback: compute aggregate scores and basic suggestions
      const flattened = Array.isArray(evaluations) ? evaluations : [];
      const scores = flattened.map((e) => Number(e.score || e.final || 0));
      const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) : 0;

      const categoryScores = {
        technical: Math.min(100, avg * 10),
        communication: Math.min(100, avg * 8),
        problemSolving: Math.min(100, avg * 9),
        confidence: Math.min(100, avg * 7),
      };

      const strengths = [];
      const improvements = [];
      if (avg > 6) strengths.push('Good overall performance and coverage of topics');
      else improvements.push('Provide more depth and examples in answers');

      return {
        overallScore: avg * 10,
        categoryScores,
        strengths,
        improvements,
        recommendations: ['Practice detailed technical explanations', 'Include examples and metrics in answers'],
      };
    }
  }

  /**
   * Evaluate voice answer with structured scoring
   * Returns: technical, clarity, depth, communication scores and feedback
   */
  async evaluateVoiceAnswer(question, transcript, expectedAnswer = '') {
    try {
      const prompt = `You are an expert technical interviewer evaluating a candidate's voice-recorded answer.

Question: ${question}
${expectedAnswer ? `Expected Answer Points: ${expectedAnswer}\n` : ''}
Candidate's Answer (Transcript): ${transcript}

Evaluate the answer based on these criteria (each scored 0-10):

1. **Technical Accuracy** (0-10): Correctness of technical content, accuracy of concepts, proper use of terminology
2. **Clarity** (0-10): How clear and articulate the explanation is, easy to understand
3. **Depth** (0-10): Level of detail, thoroughness, demonstrates deep understanding
4. **Communication** (0-10): Structure, flow, confidence, ability to convey ideas effectively

Provide evaluation in this EXACT JSON format:
{
  "technical": 0-10,
  "clarity": 0-10,
  "depth": 0-10,
  "communication": 0-10,
  "feedback": "detailed constructive feedback covering all aspects"
}

Return ONLY the JSON object, no additional text.`;

      const response = await callGroqChatCompletion({
        operation: 'evaluateVoiceAnswer',
        model: GROQ_DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert interviewer evaluating voice answers. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 600,
        retries: 3,
        baseDelay: 600,
        timeout: 10000,
      });

      const content = extractGroqMessageContent(response);

      // Parse JSON response
      let evaluation;
      try {
        evaluation = parseGroqJsonContent(content);
      } catch (parseError) {
        throw parseError;
      }

      // Calculate final score using custom formula:
      // Final Score = (technical × 0.5) + (depth × 0.2) + (clarity × 0.2) + (communication × 0.1)
      const finalScore = (
        evaluation.technical * 0.5 +
        evaluation.depth * 0.2 +
        evaluation.clarity * 0.2 +
        evaluation.communication * 0.1
      ).toFixed(2);

      evaluation.final = parseFloat(finalScore);

      return evaluation;
    } catch (error) {
      console.error('AI Voice Evaluation Error:', error);
      throw new AppError('Failed to evaluate voice answer using AI', 500);
    }
  }
}

export default new AIService();
