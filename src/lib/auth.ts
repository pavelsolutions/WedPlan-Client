import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const mongoUri = process.env.DATABASE_URL;

if (!mongoUri) {
  throw new Error("DATABASE_URL is not configured");
}

const client = new MongoClient(mongoUri);
const db = client.db("wedPlanDB");

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: ["admin", "customer", 'vendor'],
        defaultValue: "customer",
        input: true,
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.role !== "customer" && user.role !== "vendor") {
            return false;
          }
        },
      },
      update: {
        before: async (user) => {
          if ("role" in user) {
            return false;
          }
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

});


