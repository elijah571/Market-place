import mongoose from 'mongoose';

export const connectDb = async () => {
  try {
    const data = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDb connected ${data.connection.host}`);
  } catch (error) {
    console.error(`MongoDb connection error: ${error.message}`);
    process.exit(1);
  }
};
