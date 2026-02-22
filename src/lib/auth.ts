import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

declare module "next-auth" {
  interface User {
    orgId: string;
    role: "admin" | "sales_manager" | "sales_rep";
    firstName: string;
    lastName: string;
  }
  interface Session {
    user: User & {
      id: string;
      email: string;
    };
  }
}

type UserRole = "admin" | "sales_manager" | "sales_rep";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase().trim()))
          .limit(1);

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        if (user.status !== "active") return null;

        return {
          id: user.id,
          email: user.email,
          orgId: user.orgId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.orgId = user.orgId;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.orgId = token.orgId as string;
      session.user.role = token.role as UserRole;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      return session;
    },
  },
});
