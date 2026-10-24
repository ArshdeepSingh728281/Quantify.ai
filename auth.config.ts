import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;

      // Dashboard is public.
      if (pathname === "/") {
        return true;
      }

      // Login page is public.
      if (pathname.startsWith("/login")) {
        return true;
      }

      // Everything else requires authentication.
      return !!auth?.user;
    },
  },

  providers: [],
} satisfies NextAuthConfig;