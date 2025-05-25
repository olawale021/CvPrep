'use client';

import { AuthContextProvider } from "../context/AuthContext";
import NoSSR from "./NoSSR";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { Toaster } from "./ui/Toaster";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NoSSR>
      <ErrorBoundary>
        <AuthContextProvider>
          {children}
          <Toaster />
        </AuthContextProvider>
      </ErrorBoundary>
    </NoSSR>
  );
} 