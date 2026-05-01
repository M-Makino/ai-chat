import mongoose from 'mongoose';

const globalWithMongoose = global as typeof global & {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('環境変数 MONGODB_URI が設定されていません');

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((mg) => mg);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
