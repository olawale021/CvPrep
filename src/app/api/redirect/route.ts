import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import logger from "../../../lib/logger";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(request: NextRequest) {
  // Get the target path from the query parameter
  const searchParams = request.nextUrl.searchParams;
  const targetPath = searchParams.get("to") || "/dashboard";
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    logger.debug("Redirect API called", {
      targetPath,
      isAuthenticated: !!session,
      context: "RedirectAPI"
    });
    
    // If user is not authenticated and trying to access protected route,
    // redirect to home with callback
    if (!session && targetPath.startsWith("/dashboard")) {
      logger.debug("Unauthenticated user, redirecting to home", {
        context: "RedirectAPI"
      });
      
      return NextResponse.redirect(
        new URL(`/?callbackUrl=${encodeURIComponent(targetPath)}`, request.url)
      );
    }
    
    // For authenticated users, redirect to the target path
    logger.debug("Redirecting authenticated user", {
      targetPath,
      context: "RedirectAPI"
    });
    
    return NextResponse.redirect(new URL(targetPath, request.url));
  } catch (error) {
    logger.error("Error in redirect API", {
      error,
      context: "RedirectAPI"
    });
    
    // In case of error, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }
} 