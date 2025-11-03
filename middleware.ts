export { auth as middleware } from "@/auth";

// This matcher ensures the middleware runs on all paths except for API routes,
// static files, and image optimization files.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
