# InterviewIQ Backend

This folder contains the backend for InterviewIQ — an AI-powered mock interview platform.

## Overview
- Node.js + Express backend
- MongoDB for persistence
- AI integration (Groq/Sanity/OpenAI-compatible clients) with robust retry and fallback logic
- Resume analysis, interview lifecycle, evaluation, and reporting

## Features
- Interview creation, question generation, answer submission, evaluation, and report generation
- Fallback question bank (stored in `src/data/questionBank.json`) when AI is unavailable
- Keyword-based answer evaluation fallback
- Resume ATS-style scoring without AI
- Safe defaults for dashboard analytics

## Setup
1. Copy the `.env.example` to `.env` and fill in your credentials.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Run in development:

```bash
npm run dev
```

## Important environment variables
- `MONGO_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - JWT secrets
- `EMAIL_USER`, `EMAIL_PASS` - Email settings for sending notifications
- `CLOUDINARY_*` - Cloudinary credentials (optional)
- `GROQ_API_KEY` - Groq/OpenAI-compatible API key (optional — fallback logic is available)

## Fallback behavior
- If AI calls fail after retries, the system automatically uses the structured question bank in `src/data/questionBank.json` and deterministic scoring.
- Resume analysis has deterministic ATS scoring and will run without AI.

## Notes for Publication
- All secrets have been removed from `.env.example` and `.env` to prepare the project for public publishing.
- Before publishing, verify no other secrets exist in source files or config.

---
