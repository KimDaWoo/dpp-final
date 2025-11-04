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
      const isAppRoute = ['/dashboard', '/checklist', '/trades', '/mistakes', '/mypage', '/quiz'].some(path => nextUrl.pathname.startsWith(path));

      // 1. 로그인한 사용자가 초기 화면('/')에 접근한 경우
      if (isLoggedIn && nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', nextUrl));
      }

      // 2. 로그인하지 않은 사용자가 보호된 경로에 접근한 경우
      if (!isLoggedIn && isAppRoute) {
        return false; // 로그인 페이지로 리디렉션
      }

      // 3. 그 외 모든 경우는 허용
      return true;
    },
  },
});
