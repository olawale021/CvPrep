"use client";

import {
    Briefcase,
    ChevronLeft,
    ChevronRight,
    FileText,
    FolderClosed,
    GraduationCap,
    Home,
    LineChart,
    LogOut,
    Menu,
    MoreVertical,
    Plus,
    Settings,
    Users,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "../ui/DropdownMenu";
import { ResumeUploadDialog } from "./ResumeUploadDialog";

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className = "" }: SidebarProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (!mobile) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const navLinks = [
    { href: "/dashboard", label: "Home", icon: <Home className="h-5 w-5" /> },
    { href: "/resume-builder", label: "Resume Builder", icon: <FolderClosed className="h-5 w-5" /> },
    { href: "/career-roadmap", label: "Progress Tracker", icon: <LineChart className="h-5 w-5" /> },
    { href: "/interview-prep", label: "Interview Prep", icon: <GraduationCap className="h-5 w-5" /> },
    { href: "/cover-letter", label: "Cover Letter", icon: <FileText className="h-5 w-5" /> },
    { href: "/job-search", label: "Job Opportunities", icon: <Briefcase className="h-5 w-5" /> },
    { href: "/community", label: "Community", icon: <Users className="h-5 w-5" /> },
  ];

  const handleResumeUploadOpen = () => {
    setShowResumeUpload(true);
  };

  const handleResumeUploadSuccess = () => {
    // No need to refresh resumes as we're not displaying them in the sidebar anymore
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };
  
  const toggleSidebarVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Allow navigation links to close sidebar on mobile
  const handleNavigation = () => {
    if (isMobile) {
      setIsVisible(false);
    }
  };

  // Determine if sidebar should show expanded view
  const showExpandedView = isExpanded || isMobile;

  return (
    <>
      {/* Mobile menu overlay */}
      {isVisible && isMobile && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-20"
          onClick={() => setIsVisible(false)}
        />
      )}
      
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 right-4 z-30 p-2 rounded-md bg-white shadow-md"
        onClick={toggleSidebarVisibility}
        aria-label="Toggle sidebar"
      >
        {isVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      
      {/* Sidebar */}
      <div 
        className={`
          fixed md:static inset-y-0 md:left-0 ${isMobile ? 'right-0' : 'left-0'} z-30
          ${isMobile ? 'w-64' : isExpanded ? 'w-64' : 'w-20'} 
          ${isVisible ? 'translate-x-0' : `${isMobile ? 'translate-x-full' : '-translate-x-full'} md:translate-x-0`} 
          bg-white shadow-md flex flex-col h-full transition-all duration-300
          ${className}
        `}
      >
        {/* Desktop Toggle Button (hidden on mobile) */}
        {!isMobile && (
          <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md border hidden md:flex items-center justify-center"
          >
            {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}

        {/* Profile Section */}
        <div className="flex flex-col items-center justify-center py-6 border-b">
          <div className="rounded-full overflow-hidden w-12 h-12 bg-lime-200 mb-2">
            {user?.user_metadata?.avatar_url ? (
              <Image 
                src={user.user_metadata.avatar_url} 
                alt={user.user_metadata?.full_name || "User"} 
                width={48} 
                height={48} 
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-800 font-medium">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            )}
          </div>
          
          {showExpandedView && (
            <div className="text-center">
              <h3 className="font-medium text-gray-800 truncate max-w-[160px]">
                {user?.user_metadata?.full_name || "User"}
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-[160px]">
                {user?.email || ""}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="mt-1 p-1 rounded-full hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem>
                    <Link href="/settings" className="flex items-center w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button onClick={() => signOut()} className="flex items-center text-red-600 w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6">
          <div className="space-y-2 px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleNavigation}
                  className={`flex items-center ${showExpandedView ? 'px-3 py-2.5' : 'p-3 justify-center'} rounded-md text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-gray-500'} ${showExpandedView ? 'mr-3' : ''}`}>
                    {link.icon}
                  </span>
                  {showExpandedView && <span>{link.label}</span>}
                  {!showExpandedView && isActive && (
                    <span className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-md" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* Resume Upload Dialog Trigger */}
        <div className="p-4 border-t">
          <button 
            onClick={handleResumeUploadOpen}
            className={`${showExpandedView ? 'w-full flex items-center justify-center gap-2 py-2 px-3' : 'p-2 rounded-full'} bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors`}
            aria-label="Upload Resume"
          >
            <Plus className="h-4 w-4" />
            {showExpandedView && <span className="text-sm font-medium">Upload Resume</span>}
          </button>
        </div>
        
        {/* Resume Upload Dialog */}
        <ResumeUploadDialog 
          open={showResumeUpload} 
          onOpenChange={setShowResumeUpload} 
          onSuccess={handleResumeUploadSuccess}
        />
      </div>
    </>
  );
} 