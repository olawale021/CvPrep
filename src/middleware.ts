import { withAuth } from "next-auth/middleware";

// Auth.js middleware handles protected routes and authentications
export default withAuth({
  pages: {
    signIn: "/",
  },
});

// Configure matcher to specifically include paths we want to run middleware on
export const config = {
  matcher: [
    "/dashboard/:path*",
    // Include all paths except excluded ones defined in the excluded paths array
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Explicitly match auth callback routes to apply headers
    '/api/auth/:path*',
    '/auth/callback/:path*',
  ],
}; 