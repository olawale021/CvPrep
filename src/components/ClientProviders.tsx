'use client';

import { AuthContextProvider } from "../context/AuthContext";
import NoSSR from "./NoSSR";
import { Toaster } from "./ui/Toaster";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NoSSR>
      <AuthContextProvider>
        {children}
        <Toaster />
      </AuthContextProvider>
    </NoSSR>
  );
} 