'use client';

import { AuthProvider } from "../context/AuthContext";
import NoSSR from "./NoSSR";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NoSSR>
      <AuthProvider>{children}</AuthProvider>
    </NoSSR>
  );
} 