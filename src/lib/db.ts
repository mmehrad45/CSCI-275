// src/lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Keep a global cached connection across hot reloads in dev
type MongooseGlobal = typeof globalThis & {
  __mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const g = global as MongooseGlobal;

if (!g.__mongoose) {
  g.__mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (g.__mongoose!.conn) return g.__mongoose!.conn;

  if (!g.__mongoose!.promise) {
    g.__mongoose!.promise = mongoose.connect(MONGODB_URI, {
      
      serverSelectionTimeoutMS: 15000,
    });
  }

  g.__mongoose!.conn = await g.__mongoose!.promise;
  return g.__mongoose!.conn;
}