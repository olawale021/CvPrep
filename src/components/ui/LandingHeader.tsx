"use client";

import { User } from "@supabase/supabase-js";
import { LogOut, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import { Button } from "../ui/Button";

// Create a type that works with both NextAuth and Supabase users
type AuthUser = User | {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
};

// Update interface to use the combined type
interface UserDropdownProps {
  user: AuthUser;
  signOut: () => Promise<void>;
}

const UserDropdown = ({ user, signOut }: UserDropdownProps) => {
  // Get user details safely regardless of the user type
  const userEmail = user.email || '';
  const userName = 'user_metadata' in user 
    ? user.user_metadata?.full_name 
    : user.name || 'User';
  const avatarUrl = 'user_metadata' in user 
    ? user.user_metadata?.avatar_url 
    : user.image || '';

  return (
    <div className="relative group">
      <Button variant="ghost" className="relative h-8 flex items-center gap-2 px-2 group">
        <Avatar className="h-6 w-6">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            {userEmail?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:inline-block font-medium">
          {userEmail}
        </span>
      </Button>
      
      <div className="absolute right-0 mt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 ease-in-out z-10">
        <div className="bg-white rounded-md border border-gray-200 shadow-md overflow-hidden">
          <div className="p-3 border-b">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {userName}
              </p>
              <p className="text-xs text-gray-500">
                {userEmail}
              </p>
            </div>
          </div>
          
          <div className="py-1">
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <UserCircle className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Link>
            <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </div>
          
          <div className="py-1 border-t">
            <button 
              onClick={signOut}
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LandingHeader() {
  const { user, signInWithGoogle, signOut } = useAuth();
  
  // Handle login
  const handleLogin = () => {
    signInWithGoogle('/dashboard');
  };

  // Handle trial signup
  const handleTrial = () => {
    signInWithGoogle('/dashboard');
  };

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-white border-b">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-blue-600">
          <Link href="/">CareerPal</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          
          {user ? (
            <UserDropdown user={user} signOut={signOut} />
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-gray-900"
                onClick={handleLogin}
              >
                Log in
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleTrial}
              >
                Start free trial
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 