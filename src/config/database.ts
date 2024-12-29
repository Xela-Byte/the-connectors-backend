import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const URI = process.env.MONGO_URI || '';

export const connectToDB = (dbName: string, server: () => void): void => {
  mongoose.set('strictQuery', false);

  mongoose
    .connect(URI)
    .then(() => {
      console.log(`Connected to ${dbName} DB successfully`);
    })
    .then(() => {
      server();
    })
    .catch((err: unknown) => {
      console.error(err);
    });
};

