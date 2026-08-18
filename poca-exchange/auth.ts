import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";

// docs/AUTH_SPEC.md MVP phase: Google, X(Twitter), Kakao, Naver social login.
// Each provider is included only once its env vars are actually set, so the
// app still boots cleanly before OAuth app credentials have been issued.
const providers = [
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? Google : null,
  process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET ? Twitter : null,
  process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET ? Kakao : null,
  process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET ? Naver : null,
].filter((p) => p !== null);

export const { handlers, signIn, signOut, auth } = NextAuth({
  // @auth/prisma-adapter is typed against the `@prisma/client` PrismaClient,
  // but Prisma 7 generates ours into app/generated/prisma — structurally the
  // same client, nominally a different type. The adapter only touches the
  // standard User/Account/Session/VerificationToken delegates, all of which
  // exist here, so the cast is safe.
  adapter: PrismaAdapter(prisma as unknown as PrismaClient),
  providers,
  session: { strategy: "database" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
