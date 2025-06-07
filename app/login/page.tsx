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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to CvPrep</h1>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          onClick={() => signInWithGoogle()}
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
