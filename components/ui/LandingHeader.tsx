"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Button } from "./Button";

export default function LandingHeader() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userName = user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || "";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="hidden sm:block">CareerPal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-6">
              <Link 
                href="/features" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                About
              </Link>
            </nav>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={avatarUrl} alt={`${userName}&apos;s profile`} />
                      <AvatarFallback className="text-xs">{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800 text-sm max-w-24 truncate">
                      {userName}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={signOut}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-1" /> 
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-4">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={`${userName}&apos;s profile`} />
                <AvatarFallback className="text-xs">{userName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/features"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              
              {/* Mobile User Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center px-3 py-2">
                      <span className="text-sm font-medium text-gray-800">
                        Welcome, {userName}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={signOut}
                      className="w-full justify-start px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start px-3 py-2">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mx-3">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 