import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  appName: "CoLiv",
  secret: process.env.BETTER_AUTH_SECRET ?? "coliv-dev-secret-please-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  // 复用现有 User 表，avatarUrl 映射为 image
  user: {
    modelName: "User",
    fields: {
      image: "avatarUrl",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 天
    updateAge: 60 * 60 * 24,      // 每天续期
  },
  advanced: {
    cookiePrefix: "coliv",
  },
});

export type Session = typeof auth.$Infer.Session;
