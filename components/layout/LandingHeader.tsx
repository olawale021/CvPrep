"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/base/Avatar";
import { Button } from "../ui/base/Button";

export default function LandingHeader() {
  const { user, signOut, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userName = user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || "";

  // Handle scroll detection for transparency effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg' 
          : 'bg-white/10 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-10">
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-blue-600' : 'text-gray-900 font-extrabold'
            }`}>
              CvPrep
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className={`transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-700 hover:text-gray-900 font-medium'
              }`}
            >
              Features
            </button>
            <Link 
              href="/pricing" 
              className={`transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-700 hover:text-gray-900 font-medium'
              }`}
            >
              Pricing
            </Link>
            <button
              onClick={() => scrollToSection('testimonials')}
              className={`transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-700 hover:text-gray-900 font-medium'
              }`}
            >
              Testimonials
            </button>
            <Link 
              href="/blog" 
              className={`transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-700 hover:text-gray-900 font-medium'
              }`}
            >
              Blog
            </Link>
          </nav>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && user ? (
              // Authenticated user
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8 ring-2 ring-blue-200/50">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className={`transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/20'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Non-authenticated user
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    className={`transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/20'
                    }`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ring-2 ring-slate-200/50">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className={`md:hidden inline-flex items-center justify-center p-2 rounded-md transition-colors duration-300 ${
              isScrolled
                ? 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/20'
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white shadow-lg font-sans">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-2 py-1 text-gray-900 hover:text-blue-600 transition-colors duration-300 font-sans"
              >
                Features
              </button>
              <Link
                href="/pricing"
                className="px-2 py-1 text-gray-900 hover:text-blue-600 transition-colors duration-300 font-sans"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-left px-2 py-1 text-gray-900 hover:text-blue-600 transition-colors duration-300 font-sans"
              >
                Testimonials
              </button>
              <Link
                href="/blog"
                className="px-2 py-1 text-gray-900 hover:text-blue-600 transition-colors duration-300 font-sans"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              
              {!isLoading && user ? (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg font-sans">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-gray-900 hover:text-blue-600 transition-colors duration-300 font-sans"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className="w-full text-gray-900 hover:text-blue-600 transition-colors duration-300 font-sans"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg font-sans">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
