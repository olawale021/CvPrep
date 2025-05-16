'use client';

import { AuthProvider } from "../context/AuthContext";
import NoSSR from "./NoSSR";
import { Toaster } from "./ui/Toaster";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NoSSR>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </NoSSR>
  );
} 