import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  if (mongoose.connection.readyState >= 1) return;
  const options = MONGODB_DB ? { dbName: MONGODB_DB } : undefined;
  return mongoose.connect(MONGODB_URI, options);
}

export default connectToDatabase;