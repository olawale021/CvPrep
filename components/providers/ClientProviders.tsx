'use client';

import { AuthContextProvider } from "../../context/AuthContext";
import { LoadingProvider } from "../../context/LoadingContext";
import FeedbackWidget from "../features/feedback/FeedbackWidget";
import { ErrorBoundary } from "../ui/feedback/ErrorBoundary";
import { GlobalLoadingOverlay } from "../ui/feedback/GlobalLoadingOverlay";
import { Toaster } from "../ui/feedback/Toaster";
import ClientOnly from "./ClientOnly";
import QueryProvider from "./QueryProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
      <ErrorBoundary>
        <QueryProvider>
        <LoadingProvider>
          <AuthContextProvider>
            {children}
            <GlobalLoadingOverlay />
            <Toaster />
            <FeedbackWidget />
          </AuthContextProvider>
        </LoadingProvider>
        </QueryProvider>
      </ErrorBoundary>
    </ClientOnly>
  );
} 