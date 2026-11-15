import fs from 'fs/promises';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';
import { extractTextFromFile, countWords } from '../utils/fileExtractor.js';
import resumeAIService from './resumeAI.service.js';
import { ROLE_PROFILES, matchResume } from '../utils/skillMatcher.js';



class ResumeService {
  async uploadResume(userId, file) {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const filePath = file.path;

    try {
      console.log('[resume.upload] processing started', {
        userId: userId?.toString?.(),
        mimetype: file.mimetype,
      });

      // Extract text from PDF or DOCX
      const extractedText = await extractTextFromFile(filePath, file.mimetype);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new AppError('Could not extract text from file. Please ensure file is readable.', 400);
      }

      console.log('[resume.analysis] text extracted', {
        userId: userId?.toString?.(),
        length: extractedText.length,
      });

      // Cloud storage is optional: a Cloudinary problem must not block analysis
      let fileUrl = '';
      let publicId = '';

      if (isCloudinaryConfigured()) {
        try {
          const up = await cloudinary.uploader.upload(filePath, {
            folder: 'interviewiq/resumes',
            resource_type: 'raw',
          });
          fileUrl = up.secure_url;
          publicId = up.public_id;
        } catch (e) {
          console.error('[resume.upload] Cloudinary failed, continuing without storage:', e?.message || e);
        }
      } else {
        console.warn('[resume.upload] Cloudinary not configured, skipping file storage');
      }

      // Delete local file
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Warning: Could not delete local file:', unlinkError.message);
      }

      // Extract skills and analysis
      const analysis = await this.buildAnalysis(extractedText);

      console.log('[resume.analysis] completed', {
        userId: userId?.toString?.(),
        wordCount: analysis.wordCount,
        score: analysis.score,
        detectedSkills: analysis.detectedSkills.length,
      });

      // Save to database
      const resume = await Resume.create({
        user: userId,
        filename: file.originalname,
        fileUrl,
        cloudinaryPublicId: publicId,
        extractedText,
        skills: analysis.detectedSkills,
        skillScore: analysis.score,
        resumeStrength: analysis.score,
      });

      // Save detailed analysis record
          await ResumeAnalysis.findOneAndUpdate(
        { resumeId: resume._id },
        {
          userId,
          resumeId: resume._id,
          resumeUrl: fileUrl,
          score: analysis.score,
          structureScore: analysis.structureScore,
          experienceScore: analysis.experienceScore,
          skillsScore: analysis.skillsScore,
          achievementsScore: analysis.achievementsScore,
          summary: analysis.summary || '',
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          improvedBullets: analysis.improvedBullets || [],
          aiPowered: Boolean(analysis.aiPowered),
          detectedSkills: analysis.detectedSkills,
          missingSkills: analysis.missingSkills,
          suggestions: analysis.suggestions,
          wordCount: analysis.wordCount,
        },
        { upsert: true, new: true }
      );

      return {
        resume,
        analysis: {
          wordCount: analysis.wordCount,
          detectedSkills: analysis.detectedSkills,
          missingSkills: analysis.missingSkills,
          suggestions: analysis.suggestions,
          score: analysis.score,
          structureScore: analysis.structureScore,
          experienceScore: analysis.experienceScore,
          skillsScore: analysis.skillsScore,
          achievementsScore: analysis.achievementsScore,
          summary: analysis.summary || '',
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          improvedBullets: analysis.improvedBullets || [],
          aiPowered: Boolean(analysis.aiPowered),
        },
      };
    } catch (error) {
      // Clean up file if anything fails
      try {
        await fs.unlink(filePath);
      } catch {
        // file may already be deleted
      }

      if (error instanceof AppError) {
        throw error;
      }

      console.error('Resume upload error:', error);

      throw new AppError(
        process.env.NODE_ENV === 'development'
          ? `Failed to process resume: ${error.message}`
          : 'Failed to process resume. Please try again.',
        500
      );
    }
  }

  async getUserResumes(userId) {
    const resumes = await Resume.find({ user: userId }).sort({ createdAt: -1 });
    return resumes;
  }

  async getResumeById(resumeId, userId) {
    const resume = await Resume.findOne({ _id: resumeId, user: userId });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    return resume;
  }

  async deleteResume(resumeId, userId) {
    const resume = await Resume.findOne({ _id: resumeId, user: userId });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Delete from Cloudinary (only if a file was stored)
    if (resume.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(resume.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (e) {
        console.error('Cloudinary delete failed:', e.message);
      }
    }

    // Delete from database
    await Resume.findByIdAndDelete(resumeId);

    return {
      message: 'Resume deleted successfully',
    };
  }

  /** Keyword analysis + AI analysis merged. AI fields are optional. */
  async buildAnalysis(text) {
    const base = this.analyzeResume(text);
    const ai = await resumeAIService.analyze(text);

    if (!ai) {
      return { ...base, aiPowered: false };
    }

    return {
      ...base,
      score: ai.overallScore,
      structureScore: ai.structureScore,
      experienceScore: ai.experienceScore,
      skillsScore: ai.skillsScore,
      achievementsScore: ai.achievementsScore,
      summary: ai.summary,
      strengths: ai.strengths,
      weaknesses: ai.weaknesses,
      improvedBullets: ai.improvedBullets,
      // merge AI suggestions first, then keyword ones, de-duplicated
      suggestions: [...new Set([...ai.suggestions, ...base.suggestions])].slice(0, 8),
      missingSkills: [...new Set([...ai.missingSkills, ...base.missingSkills])].slice(0, 8),
      aiPowered: true,
    };
  }

  analyzeResume(text) {
    const wordCount = countWords(text);
    const normalizedText = text.toLowerCase();

    // Standard skills to check for
    const fullSkillDictionary = {
      javascript: { weight: 4, category: 'language' },
      typescript: { weight: 4, category: 'language' },
      react: { weight: 4, category: 'framework' },
      'node.js': { weight: 4, category: 'framework' },
      nodejs: { weight: 4, category: 'framework' },
      mongodb: { weight: 4, category: 'database' },
      express: { weight: 3, category: 'framework' },
      sql: { weight: 3, category: 'database' },
      postgresql: { weight: 3, category: 'database' },
      mysql: { weight: 3, category: 'database' },
      redis: { weight: 3, category: 'database' },
      aws: { weight: 4, category: 'cloud' },
      docker: { weight: 3, category: 'devops' },
      kubernetes: { weight: 4, category: 'devops' },
      python: { weight: 4, category: 'language' },
      java: { weight: 4, category: 'language' },
      'spring boot': { weight: 4, category: 'framework' },
      django: { weight: 3, category: 'framework' },
      flask: { weight: 3, category: 'framework' },
      html: { weight: 2, category: 'markup' },
      css: { weight: 2, category: 'styling' },
      'rest api': { weight: 3, category: 'architecture' },
      restapi: { weight: 3, category: 'architecture' },
      graphql: { weight: 3, category: 'architecture' },
      git: { weight: 2, category: 'vcs' },
      'machine learning': { weight: 4, category: 'ai' },
      'deep learning': { weight: 4, category: 'ai' },
      tensorflow: { weight: 4, category: 'ai' },
      pytorch: { weight: 4, category: 'ai' },
      ai: { weight: 4, category: 'ai' },
      'data science': { weight: 4, category: 'data' },
      pandas: { weight: 3, category: 'data' },
      numpy: { weight: 3, category: 'data' },
      'c++': { weight: 3, category: 'language' },
      'c#': { weight: 3, category: 'language' },
      csharp: { weight: 3, category: 'language' },
      go: { weight: 3, category: 'language' },
      rust: { weight: 3, category: 'language' },
      angular: { weight: 4, category: 'framework' },
      vue: { weight: 3, category: 'framework' },
      vuejs: { weight: 3, category: 'framework' },
      nextjs: { weight: 4, category: 'framework' },
      'next.js': { weight: 4, category: 'framework' },
      webpack: { weight: 2, category: 'tool' },
      vite: { weight: 2, category: 'tool' },
      jest: { weight: 2, category: 'testing' },
      mocha: { weight: 2, category: 'testing' },
      junit: { weight: 2, category: 'testing' },
      linux: { weight: 2, category: 'os' },
      windows: { weight: 1, category: 'os' },
      macos: { weight: 1, category: 'os' },
      mobile: { weight: 3, category: 'platform' },
      ios: { weight: 3, category: 'platform' },
      android: { weight: 3, category: 'platform' },
      react_native: { weight: 3, category: 'framework' },
      firebase: { weight: 3, category: 'backend' },
      gcp: { weight: 3, category: 'cloud' },
      azure: { weight: 3, category: 'cloud' },
      agile: { weight: 2, category: 'methodology' },
      scrum: { weight: 2, category: 'methodology' },
      jira: { weight: 2, category: 'tool' },
      ci_cd: { weight: 3, category: 'devops' },
      cicd: { weight: 3, category: 'devops' },
      jenkins: { weight: 3, category: 'devops' },
    };

    const skillsFound = [];
    let matchedWeight = 0;
    let totalWeight = 0;

    Object.entries(fullSkillDictionary).forEach(([skill, { weight }]) => {
      totalWeight += weight;
      const skillRegex = new RegExp(`\\b${skill.replace(/[+.]/g, '\\$&')}\\b`, 'gi');
      if (skillRegex.test(normalizedText)) {
        skillsFound.push(skill);
        matchedWeight += weight;
      }
    });

    // Calculate skill score based on weighted match coverage
    const skillScore = totalWeight > 0
      ? Math.min(100, Math.round((matchedWeight / totalWeight) * 100))
      : 0;

    // Resume strength scoring
    // 60% skill relevance + 30% skill count + 10% word count adequacy
    const skillCountScore = Math.min(skillsFound.length * 5, 30);
    const wordCountScore = Math.min(wordCount / 50, 10); // Assume minimum 50 words
    const resumeStrength = Math.min(
      100,
      Math.round(skillScore * 0.6 + skillCountScore + wordCountScore)
    );

    // Common missing skills (high priority)
    const importantSkills = [
      'javascript', 'react', 'node.js', 'nodejs', 'mongodb', 'express',
      'python', 'java', 'aws', 'docker', 'git', 'sql'
    ];

    const missingSkills = importantSkills.filter(
      skill => !skillsFound.includes(skill) &&
        !normalizedText.includes(skill.toLowerCase())
    );

    const suggestions = this._generateSuggestions(missingSkills.slice(0, 5));
    return {
      wordCount,
      detectedSkills: [...new Set(skillsFound)],
      missingSkills: missingSkills.slice(0, 5),
      suggestions,
      score: resumeStrength,
    };
  }

  _generateSuggestions(missingSkills) {
    const suggestionMap = {
      javascript: "Add JavaScript projects or mention the frameworks you've used (React, Vue, Node.js).",
      typescript: 'Include TypeScript in a project to demonstrate static typing skills.',
      react: 'Add React.js projects showcasing components, hooks, and state management.',
      'node.js': 'Include Node.js backend API or server-side projects.',
      nodejs: 'Include Node.js backend API or server-side projects.',
      mongodb: 'Add a MongoDB-backed project to demonstrate NoSQL database experience.',
      express: 'Include Express.js REST API development in your project descriptions.',
      sql: 'Mention SQL database experience (MySQL, PostgreSQL, or SQLite).',
      postgresql: 'Add PostgreSQL projects with schema design and complex querying.',
      mysql: 'Include MySQL database design and integration projects.',
      redis: 'Add Redis caching or pub/sub messaging experience to a project.',
      aws: 'Include AWS cloud experience (EC2, S3, Lambda, or RDS).',
      docker: 'Add a Docker containerization project with Dockerfile and docker-compose.',
      kubernetes: 'Include Kubernetes deployment manifests or cluster management experience.',
      python: 'Add Python scripting, data processing, or web application projects.',
      java: 'Include Java-based backend or enterprise application experience.',
      'spring boot': 'Add a Spring Boot REST API or microservices project.',
      django: 'Include a Django web application or REST API project.',
      flask: 'Add a Flask API development or microservice project.',
      html: 'Include HTML-based front-end projects or add a portfolio link.',
      css: 'Add CSS-styled projects; mention Tailwind, Bootstrap, or SASS experience.',
      'rest api': 'Highlight RESTful API design and integration in project descriptions.',
      graphql: 'Add a GraphQL API project with schema, resolvers, and client queries.',
      git: 'Mention Git version control practices and link your GitHub/GitLab profile.',
      'machine learning': 'Add a machine learning project (classification, regression, or NLP).',
      'deep learning': 'Include a deep learning project using TensorFlow or PyTorch.',
      tensorflow: 'Add a TensorFlow model training or deployment project.',
      pytorch: 'Include a PyTorch deep learning or research project.',
      ai: 'Add AI/ML projects, use-cases, or relevant certifications.',
      'data science': 'Include data science projects using pandas, NumPy, or visualization tools.',
      angular: 'Add Angular front-end development projects with modules and services.',
      vue: 'Include Vue.js single-page application development projects.',
      nextjs: 'Add a Next.js SSR or SSG full-stack application project.',
      'next.js': 'Add a Next.js SSR or SSG full-stack application project.',
      linux: 'Mention Linux/Unix server administration or shell scripting experience.',
      android: 'Include Android mobile application development projects.',
      ios: 'Add iOS or Swift mobile application development projects.',
      firebase: 'Include Firebase (Auth, Firestore, Cloud Functions) backend integration.',
      gcp: 'Add Google Cloud Platform deployment experience (App Engine, Cloud Run).',
      azure: 'Include Microsoft Azure cloud services or deployment experience.',
      agile: 'Highlight Agile/Scrum project management methodology in your work history.',
      cicd: 'Add CI/CD pipeline configuration (GitHub Actions, Jenkins, or GitLab CI).',
      ci_cd: 'Configure and document CI/CD pipelines for automated deployment.',
      jenkins: 'Include Jenkins CI/CD pipeline setup and job configuration.',
    };
    return missingSkills.map(
      (skill) =>
        suggestionMap[skill.toLowerCase()] ||
        `Gain hands-on experience with ${skill} and include it in a project or certification.`
    );
  }

  async getResumeAnalysis(resumeId, userId) {
    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) throw new AppError('Resume not found', 404);

    let analysis = await ResumeAnalysis.findOne({ resumeId, userId });
    if (!analysis) {
      // Auto-generate for resumes uploaded before this feature was added
      const result = this.analyzeResume(resume.extractedText);
      analysis = await ResumeAnalysis.findOneAndUpdate(
        { resumeId: resume._id },
        {
          userId,
          resumeId: resume._id,
          resumeUrl: resume.fileUrl,
          score: result.score,
          detectedSkills: result.detectedSkills,
          missingSkills: result.missingSkills,
          suggestions: result.suggestions,
          wordCount: result.wordCount,
        },
        { upsert: true, new: true }
      );
    }
    return analysis;
  }

  async matchToTarget(resumeId, userId, { targetRole, jobDescription } = {}) {
    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) throw new AppError('Resume not found', 404);

    let reqs = null;
    let source = '';

    if (jobDescription && jobDescription.trim().length > 50) {
      reqs = await resumeAIService.extractRequirements(jobDescription);
      source = 'job-description';
    }
    if (!reqs && targetRole && ROLE_PROFILES[targetRole]) {
      reqs = { role: targetRole, ...ROLE_PROFILES[targetRole] };
      source = 'role-profile';
    }
    if (!reqs) {
      throw new AppError('Select a target role or paste a job description (50+ characters)', 400);
    }

    return {
      source,
      targetRole: reqs.role || targetRole || '',
      requiredSkills: reqs.must,
      preferredSkills: reqs.nice,
      ...matchResume(resume.extractedText, reqs),
    };
  }




}

export default new ResumeService();