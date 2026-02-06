import mongoose from 'mongoose';

export const connectDb = async () => {
  mongoose.connect(process.env.MONGO_URI).then((data) => {
    console.log(`MongoDb connecte  ${data.connection.host}`);
  });
};
