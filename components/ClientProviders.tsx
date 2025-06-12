'use client';

import { AuthContextProvider } from "../context/AuthContext";
import { LoadingProvider } from "../context/LoadingContext";
import NoSSR from "./NoSSR";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import FeedbackWidget from "./ui/FeedbackWidget";
import { GlobalLoadingOverlay } from "./ui/GlobalLoadingOverlay";
import { Toaster } from "./ui/Toaster";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NoSSR>
      <ErrorBoundary>
        <LoadingProvider>
          <AuthContextProvider>
            {children}
            <GlobalLoadingOverlay />
            <FeedbackWidget />
            <Toaster />
          </AuthContextProvider>
        </LoadingProvider>
      </ErrorBoundary>
    </NoSSR>
  );
} 