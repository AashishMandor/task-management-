import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";

// No need for custom interface — use NextAuth's implicit type
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Use the correct signature expected by NextAuth v5
      async authorize(credentials, request) {
        // credentials is Partial<Record<"email" | "password", unknown>>
        // Safely cast to string | undefined
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        console.log("Authorize called - Credentials:", {
          email,
          passwordProvided: !!password,
        });

        if (!email || !password) {
          console.log("Missing email or password");
          return null;
        }

        await dbConnect();
        console.log("DB connected, searching user...");

        const lowercaseEmail = email.toLowerCase();
        console.log("Searching for email:", lowercaseEmail);

        const user = await User.findOne({ email: lowercaseEmail });

        if (!user) {
          console.log("User not found");
          return null;
        }

        if (!user.password) {
          console.log("User has no password");
          return null;
        }

        console.log("User found:", {
          id: user._id,
          email: user.email,
          name: user.name,
        });

        const isValid = await bcrypt.compare(password, user.password);
        console.log("Password valid:", isValid);

        if (!isValid) {
          console.log("Password mismatch");
          return null;
        }

        console.log("Login SUCCESS for:", user.email);

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};