"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import { Button } from "../ui/Button";

export default function LandingHeader() {
  const { user, signOut } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || "";

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <Link href="/" className="text-xl font-bold text-blue-600">
        CareerPal
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-gray-800">{userName}</span>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-5 h-5 mr-1" /> Sign out
            </Button>
          </>
        ) : (
          <Link href="/">
            <Button variant="outline">Sign in</Button>
          </Link>
        )}
      </div>
    </header>
  );
} 