import mongoose from "mongoose";

let dbStatus = 'unknown'; // 'connected' | 'disconnected' | 'not-configured'

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();

    if (!mongoUri) {
      dbStatus = 'not-configured';
      console.error('❌ MongoDB Connection Failed');
      console.error('Actual error: MONGO_URI is missing or empty in backend/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas using MONGO_URI from backend/.env');

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'interviewiq',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true
    });

    dbStatus = 'connected';
    console.log('✅ MongoDB Connected Successfully');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);

  } catch (error) {
    dbStatus = 'disconnected';
    console.error('❌ MongoDB Connection Failed');
    console.error('Actual error:', error.message);
    process.exit(1);
  }
};

const getDBStatus = () => dbStatus;

export default connectDB;
export { getDBStatus };