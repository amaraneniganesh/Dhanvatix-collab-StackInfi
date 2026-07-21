import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully');
  } catch (error: any) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('CRITICAL: Please add a real MONGODB_URI to your .env file!');
    // Not exiting process so the frontends can still launch for UI testing
  }
};
