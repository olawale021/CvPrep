"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      {/* Logo/Brand Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg">
          <span className="text-2xl font-bold text-white">CV</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Welcome to CvPrep</h1>
        <p className="text-gray-600 text-lg">AI-Powered CV Optimization & ATS Scoring</p>
      </div>

      {/* Sign In Card */}
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
          <p className="text-gray-600">Get started with your career optimization journey</p>
        </div>

        {/* Google Sign In Button */}
        <Button
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
          onClick={() => signInWithGoogle()}
          disabled={isLoading}
        >
          {/* Google Logo SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"  
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? "Signing in..." : "Continue with Google"}
        </Button>

        {/* Additional Info */}
        <div className="mt-6 text-center">
                      <p className="text-sm text-gray-500 leading-relaxed">
             By signing in, you agree to our Terms of Service and Privacy Policy. 
             Start optimizing your resume with AI-powered insights.
           </p>
        </div>
      </div>

      {/* Features Preview */}
      <div className="mt-8 text-center max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-1">ATS Scoring</h3>
            <p className="text-sm text-gray-600">Get instant feedback on your resume&apos;s ATS compatibility</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-semibold text-gray-900 mb-1">AI Optimization</h3>
            <p className="text-sm text-gray-600">Enhance your resume with AI-powered suggestions</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-semibold text-gray-900 mb-1">Professional Templates</h3>
            <p className="text-sm text-gray-600">Download polished, recruiter-ready resumes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
