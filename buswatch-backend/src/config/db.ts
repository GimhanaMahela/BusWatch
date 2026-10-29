import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async (uri: string = env.MONGO_URI): Promise<void> => {
  await mongoose.connect(uri);
  console.log("MongoDB Connected...");
};
