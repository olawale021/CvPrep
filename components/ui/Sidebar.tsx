"use client";

import {
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
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
  Star,
  Trash2,
  Users,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Resume, deleteResume, getUserResumes, setPrimaryResume } from "../../lib/resumeService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./DropdownMenu";
import { ResumeUploadDialog } from "./ResumeUploadDialog";

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className = "" }: SidebarProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isResumesExpanded, setIsResumesExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (!mobile) {
        setIsVisible(true);
        setIsExpanded(true);
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

  // Fetch user resumes when component mounts or user changes
  useEffect(() => {
    async function fetchResumes() {
      if (!user?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { resumes: userResumes, error: resumeError } = await getUserResumes(user.id);
        
        if (resumeError) {
          setError(resumeError);
        } else {
          setResumes(userResumes);
        }
      } catch (err) {
        setError('Failed to fetch resumes');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResumes();
  }, [user?.id]);
  
  const navLinks = [
    { href: "/dashboard", label: "Home", icon: <Home className="h-5 w-5" /> },
    { href: "/resume/optimize", label: "Resume Optimizer", icon: <FolderClosed className="h-5 w-5" /> },
    { href: "/career-roadmap", label: "Progress Tracker", icon: <LineChart className="h-5 w-5" /> },
    { href: "/interview-prep", label: "Interview Prep", icon: <GraduationCap className="h-5 w-5" /> },
    { href: "/cover-letter", label: "Cover Letter", icon: <FileText className="h-5 w-5" /> },
    { href: "/job-search", label: "Job Opportunities", icon: <Briefcase className="h-5 w-5" /> },
    { href: "/community", label: "Community", icon: <Users className="h-5 w-5" /> },
  ];

  const handleResumeUploadOpen = () => {
    setShowResumeUpload(true);
  };

  const handleResumeUploadSuccess = async () => {
    if (user?.id) {
      setIsLoading(true);
      const { resumes: updatedResumes } = await getUserResumes(user.id);
      setResumes(updatedResumes);
      setIsLoading(false);
      // Expand resumes section when a new resume is uploaded
      setIsResumesExpanded(true);
    }
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };
  
  const toggleSidebarVisibility = () => {
    setIsVisible(!isVisible);
  };

  const toggleResumesSection = () => {
    setIsResumesExpanded(!isResumesExpanded);
  };

  // Allow navigation links to close sidebar on mobile
  const handleNavigation = () => {
    if (isMobile) {
      setIsVisible(false);
    }
  };

  // Handle setting a resume as primary
  const handleSetPrimary = async (resumeId: string) => {
    if (!user?.id) return;
    
    try {
      const { success, error: setPrimaryError } = await setPrimaryResume(resumeId, user.id);
      
      if (success) {
        // Update local state to reflect changes
        setResumes(prevResumes => 
          prevResumes.map(resume => ({
            ...resume,
            is_primary: resume.id === resumeId
          }))
        );
      } else if (setPrimaryError) {
        console.error('Error setting primary resume:', setPrimaryError);
      }
    } catch (err) {
      console.error('Error setting primary resume:', err);
    }
  };

  // Handle deleting a resume
  const handleDeleteResume = async (resumeId: string) => {
    if (!user?.id || !window.confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      const { success, error: deleteError } = await deleteResume(resumeId, user.id);
      
      if (success) {
        // Remove the deleted resume from state
        setResumes(prevResumes => prevResumes.filter(resume => resume.id !== resumeId));
      } else if (deleteError) {
        console.error('Error deleting resume:', deleteError);
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  // Determine if sidebar should show expanded view
  const showExpandedView = isExpanded || isMobile;

  return (
    <>
      {/* Mobile menu overlay */}
      {isVisible && isMobile && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsVisible(false)}
        />
      )}
      
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={toggleSidebarVisibility}
        aria-label="Toggle sidebar"
      >
        {isVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      
      {/* Sidebar */}
      <div 
        className={`
          fixed md:sticky top-0 md:inset-y-0 inset-0 z-45
          ${isMobile ? 'w-full max-w-xs' : isExpanded ? 'w-64' : 'w-20'} 
          ${isVisible ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          bg-white shadow-md flex flex-col h-screen transition-all duration-300 ease-in-out
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
        <div className="flex flex-col items-center justify-center py-6 border-b mt-2 md:mt-0">
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
        <nav className="flex-1 py-6 overflow-y-auto">
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
            
            {/* Resumes Section (Only in expanded view) */}
            {showExpandedView && (
              <div className="mt-2">
                <button 
                  onClick={toggleResumesSection}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 mr-3" />
                    <span>My Resumes</span>
                  </div>
                  {isResumesExpanded ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </button>
                
                {isResumesExpanded && (
                  <div className="ml-8 mt-2 space-y-1">
                    {isLoading && (
                      <div className="text-sm text-gray-500 py-2 px-3">
                        Loading resumes...
                      </div>
                    )}
                    
                    {error && (
                      <div className="text-sm text-red-500 py-2 px-3">
                        {error}
                      </div>
                    )}
                    
                    {!isLoading && !error && resumes.length === 0 && (
                      <div className="text-sm text-gray-500 py-2 px-3">
                        No resumes found
                      </div>
                    )}
                    
                    {resumes.map((resume) => (
                      <div key={resume.id} className="rounded-md border border-gray-200 py-2 px-3 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                            {resume.title}
                          </span>
                          {resume.is_primary && (
                            <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          {new Date(resume.created_at).toLocaleDateString()}
                        </div>
                        
                        <div className="flex space-x-2">
                          {!resume.is_primary && (
                            <button 
                              onClick={() => handleSetPrimary(resume.id)}
                              className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                              title="Set as primary"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}
                          
                          <a 
                            href={resume.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          
                          <button 
                            onClick={() => handleDeleteResume(resume.id)}
                            className="p-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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