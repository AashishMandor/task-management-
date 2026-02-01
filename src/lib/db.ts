import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

const MONGODB_URI: string = process.env.MONGODB_URI;

// Initialize cache
let cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

// Store cache globally (for hot reloads in dev)
if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  // Use cached connection if available
  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  // Create new connection if none exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    console.log("Attempting new MongoDB connection...");

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB connected successfully!");
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("MongoDB connection failed:", err);
        cached.promise = null;
        throw err;
      });
  }

  return cached.promise;
}

export default dbConnect;
