import './envBootstrap.js';

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs/promises";
import connectDB, { getDBStatus } from "./config/db.js";
import requestTimeout from './src/middlewares/timeout.middleware.js';
import authRoutes from "./src/routes/auth.routes.js";
import resumeRoutes from "./src/routes/resume.routes.js";
import interviewRoutes from "./src/routes/interview.routes.js";
import interviewExtraRoutes from "./src/routes/interviewExtra.routes.js";
import reportRoutes from "./src/routes/report.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import evaluationRoutes from "./src/routes/evaluation.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import analysisRoutes from "./src/routes/analysis.routes.js";
import testRoutes from "./src/routes/test.routes.js";
import aiRoutes from "./routes/aiRoutes.js";
import errorHandler from "./src/middlewares/error.middleware.js";
import resumeBuilderRoutes from "./src/routes/resumeBuilder.routes.js";
import coachRoutes from "./src/routes/coach.routes.js";
import assessmentRoutes from "./src/routes/assessment.routes.js";
import evidenceRoutes from "./src/routes/evidence.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import adminDashboardRoutes from "./src/routes/adminDashboard.routes.js";
import platformSettingsRoutes from './src/routes/platformSettings.routes.js';
import aiMonitoringRoutes from './src/routes/aiMonitoring.routes.js';


const warnIfUnset = (label, value) => {
  if (!value || /^your_|^YOUR_|^change_in_production/i.test(String(value).trim())) {
    console.warn(`[ENV] ${label} is not configured.`);
  }
};

warnIfUnset('MONGO_URI / MONGODB_URI', process.env.MONGO_URI || process.env.MONGODB_URI);
warnIfUnset('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET);
warnIfUnset('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
warnIfUnset('EMAIL_USER', process.env.EMAIL_USER);
warnIfUnset('EMAIL_PASS', process.env.EMAIL_PASS);

// Ensure uploads directory exists
(async () => {
  try {
    await fs.mkdir('uploads', { recursive: true });
    console.log('Uploads directory ready');
  } catch (error) {
    console.error('Failed to create uploads directory:', error.message);
  }
})();

await connectDB();

const app = express();

// Parse request bodies first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Per-request timeout protection (prevents hanging requests)
app.use(requestTimeout);

// ========== CORS Configuration (Production-Ready) ==========
const allowedOrigins = (process.env.FRONTEND_URLS || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const isDevelopment = process.env.NODE_ENV !== "production";

const isAllowedOrigin = (origin) => {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (isDevelopment && /^http:\/\/localhost:517\d$/.test(origin)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true, // Allow cookies and authorization headers
 methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400 // Preflight cache for 24 hours
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());

// Mount all routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/interview", interviewExtraRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/resume-builder", resumeBuilderRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/assessment", assessmentRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/evidence", evidenceRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use('/api/platform-settings', platformSettingsRoutes);
app.use('/api/ai-monitoring', aiMonitoringRoutes);

// Mount test routes ONLY in development to avoid accidental exposure
if (process.env.NODE_ENV === 'development') {
  app.use("/api/test", testRoutes);
} else {
  console.log('Test routes are disabled in non-development environments');
}

app.get("/", (req,res)=>{
  res.send("API running");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = getDBStatus();
  res.json({ message: "Backend working", success: true, dbStatus });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
  
  // NOTE: Auto-run test on startup has been removed for safety.
  // Tests must be executed manually via `npm run test:interview` or by calling
  // the test API (available only in development and protected by TEST_SECRET).
  
});

