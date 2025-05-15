"use client";

import { User } from "@supabase/supabase-js";
import { Bell, LogOut, Menu, Search, Settings, UserCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Button } from "./Button";

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

// User dropdown component with proper types
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
      <Button variant="ghost" className="h-8 flex items-center gap-2 px-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            {userEmail?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:inline-block font-medium">
          {userName}
        </span>
      </Button>
      
      <div className="absolute right-0 mt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 ease-in-out z-50">
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

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white border-b z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Left side - Logo and mobile menu button */}
          <div className="flex items-center">
            <button 
              type="button" 
              className="md:hidden p-2 rounded-md text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            <Link href="/dashboard" className="text-xl font-bold text-blue-600 ml-2 md:ml-0">
              CareerPal
            </Link>
          </div>
          
          {/* Center - Search bar (hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center mx-8">
            <div className="w-full max-w-lg lg:max-w-xs relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                className="block w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Right side - Navigation and user profile */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-1 rounded-full text-gray-500 hover:bg-gray-100 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            {/* User dropdown */}
            {user && <UserDropdown user={user} signOut={signOut} />}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="p-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>
            
            <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">
              Dashboard
            </Link>
            <Link href="/resume-builder" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">
              Resume Builder
            </Link>
            <Link href="/interview-prep" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">
              Interview Prep
            </Link>
            <Link href="/cover-letter" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">
              Cover Letter
            </Link>
          </div>
        </div>
      )}
    </header>
  );
} 