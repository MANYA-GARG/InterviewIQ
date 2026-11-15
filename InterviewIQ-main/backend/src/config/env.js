import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string(),
  MONGODB_URI: Joi.string(),
  
  // JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  
  // Email
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  
  // Groq API
  GROQ_API_KEY: Joi.string().optional(),
  
  // Frontend
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
}).unknown();

export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env);

  const hasValidMongoUri = (uri) => {
    if (!uri) {
      return false;
    }

    const normalized = String(uri).trim();
    if (!/^mongodb(?:\+srv)?:\/\//i.test(normalized)) {
      return false;
    }

    return !/^mongodb(?:\+srv)?:\/\/(?:your_|YOUR_|placeholder|example|change_in_production)/i.test(normalized);
  };

  if (!error && !hasValidMongoUri(value.MONGO_URI) && !hasValidMongoUri(value.MONGODB_URI)) {
    throw new Error('❌ Environment validation error: a valid MONGO_URI or MONGODB_URI is required');
  }
  
  if (error) {
    throw new Error(`❌ Environment validation error: ${error.message}`);
  }
  
  value.MONGO_URI = hasValidMongoUri(value.MONGO_URI) ? value.MONGO_URI : value.MONGODB_URI;

  return value;
};
