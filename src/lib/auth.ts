import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "./db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Internal CRM: accounts created by admin, no public signup — email verification unnecessary
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "SALES",
        input: false,
      },
      fullName: {
        type: "string",
        required: true,
      },
      phone: {
        type: "string",
        required: false,
      },
      department: {
        type: "string",
        required: false,
      },
      position: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
