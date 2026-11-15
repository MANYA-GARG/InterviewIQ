import fs from 'fs';
import { getOpenAIClient } from '../config/openai.js';
import AppError from '../utils/AppError.js';

class SpeechService {
  /**
   * Convert audio file to text using OpenAI Whisper
   */
  async transcribeAudio(audioFilePath) {
    try {
      const openai = getOpenAIClient();
      
      if (!openai) {
        throw new AppError('OpenAI client not configured', 500);
      }

      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
      });

      return transcription;
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw new AppError('Failed to transcribe audio', 500);
    }
  }

  /**
   * Validate audio file format and size
   */
  validateAudioFile(file) {
    const allowedFormats = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/m4a'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
      throw new AppError('No audio file provided', 400);
    }

    if (!allowedFormats.includes(file.mimetype)) {
      throw new AppError(
        'Invalid audio format. Allowed: webm, mp4, mpeg, wav, m4a',
        400
      );
    }

    if (file.size > maxSize) {
      throw new AppError('Audio file too large. Maximum size: 10MB', 400);
    }

    return true;
  }
}

export default new SpeechService();
