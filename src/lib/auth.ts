import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { mongoClient, mongoDb } from "@/lib/mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    client: mongoClient,
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


