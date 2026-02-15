import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { config } from '../config';
dotenv.config({ quiet: true });

let connected = false;

export async function connectMongoose(): Promise<typeof mongoose> {
  if (connected) return mongoose;
  const url = process.env.MONGO_URL;
  if (url === undefined || url === '') throw new Error('MONGO_URL is required');
  await mongoose.connect(`${url}/${config.DB_NAME}`);
  connected = true;
  return mongoose;
}

export async function disconnectMongoose(): Promise<void> {
  if (connected) {
    await mongoose.disconnect();
    connected = false;
  }
}
