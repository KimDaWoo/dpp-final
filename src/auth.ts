// src/auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { NextResponse } from "next/server";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAppRoute = nextUrl.pathname.startsWith('/dashboard') || 
                         nextUrl.pathname.startsWith('/checklist') || 
                         nextUrl.pathname.startsWith('/trades') || 
                         nextUrl.pathname.startsWith('/mistakes');

      if (isAppRoute) {
        // If the user is on an app route, they must be logged in.
        return isLoggedIn;
      } else if (isLoggedIn) {
        // If the user is logged in and visits a public route like the home page,
        // redirect them to the dashboard.
        if (nextUrl.pathname === '/') {
          return NextResponse.redirect(new URL('/dashboard', nextUrl));
        }
      }
      
      // Allow access to all other pages (like the login page) by default.
      return true;
    },
  },
});
