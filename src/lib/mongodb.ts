import { MongoClient } from "mongodb";

const mongoUri = process.env.DATABASE_URL;

if (!mongoUri) {
  throw new Error("DATABASE_URL is not configured");
}

const globalForMongo = globalThis as typeof globalThis & {
  wedPlanMongoClient?: MongoClient;
};

export const mongoClient =
  globalForMongo.wedPlanMongoClient ?? new MongoClient(mongoUri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.wedPlanMongoClient = mongoClient;
}

export const mongoDb = mongoClient.db("wedPlanDB");
