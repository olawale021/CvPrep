"use client";

import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Download,
    FileText,
    FolderClosed,
    GraduationCap,
    HelpCircle,
    Home,
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
import { Resume, deleteResume, getUserResumes, setPrimaryResume } from "../../lib/services/resumeService";
import { ResumeUploadDialog } from "../features/resume/ResumeUploadDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "../ui/composite/DropdownMenu";

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
    { href: "/resume/create", label: "Create Resume", icon: <Plus className="h-5 w-5" /> },
    { href: "/saved-resumes", label: "Saved Resumes", icon: <FileText className="h-5 w-5" /> },
    // { href: "/resume/dashboard", label: "Resume Dashboard", icon: <Sparkles className="h-5 w-5" /> },
    { href: "/resume/dashboard", label: "Resume Optimizer", icon: <FolderClosed className="h-5 w-5" /> },
    { href: "/interview-prep", label: "Interview Prep", icon: <GraduationCap className="h-5 w-5" /> },
    { href: "/cover-letter", label: "Cover Letter", icon: <FileText className="h-5 w-5" /> },
    { href: "/community", label: "Community", icon: <Users className="h-5 w-5" /> },
    { href: "/help", label: "Help Center", icon: <HelpCircle className="h-5 w-5" /> },
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#252525] text-white shadow-md"
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
          bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl text-white shadow-2xl flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-slate-700/50
          ${className}
        `}
      >
        {/* Desktop Toggle Button (hidden on mobile) */}
        {!isMobile && (
          <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-slate-800/90 backdrop-blur-sm text-white rounded-full p-1 shadow-lg border border-slate-600/50 hidden md:flex items-center justify-center hover:bg-slate-700/90 hover:scale-110 transition-all duration-200"
          >
            <div className="transition-transform duration-200 hover:rotate-12">
              {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>
        )}

        {/* Profile Section */}
        <div className="flex flex-col items-center justify-center py-6 border-b border-slate-700/50 mt-2 md:mt-0 bg-gradient-to-r from-slate-800/20 to-slate-700/20 backdrop-blur-sm">
          <div className="rounded-full overflow-hidden w-14 h-14 bg-blue-400 mb-3">
            {user?.user_metadata?.avatar_url ? (
              <Image 
                src={user.user_metadata.avatar_url} 
                alt={user.user_metadata?.full_name || "User"} 
                width={56} 
                height={56} 
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-medium text-lg">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            )}
          </div>
          
          {showExpandedView && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white truncate max-w-[160px]">
                {user?.user_metadata?.full_name || "User"}
              </h3>
              <p className="text-sm text-slate-300 truncate max-w-[160px] font-medium">
                {user?.email || ""}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="mt-1 p-1 rounded-full hover:bg-slate-700/60 hover:backdrop-blur-sm transition-all duration-200 hover:scale-110">
                    <div className="transition-transform duration-200 hover:rotate-90">
                      <MoreVertical className="h-4 w-4 text-white" />
                    </div>
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
                    <button onClick={() => signOut()} className="flex items-center text-red-500 w-full">
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
          <div className="space-y-3 px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleNavigation}
                  className={`flex items-center ${
                    showExpandedView ? 'px-3 py-3' : 'p-3 justify-center'
                  } rounded-xl text-base font-semibold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600/80 to-blue-700/80 text-white shadow-lg backdrop-blur-sm border border-blue-500/30' 
                      : 'text-slate-300 hover:bg-slate-700/60 hover:backdrop-blur-sm hover:text-white hover:shadow-md hover:scale-105'
                  }`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} ${showExpandedView ? 'mr-3' : ''} transition-all duration-200 group-hover:scale-110 ${isActive ? 'animate-pulse' : ''}`}>
                    <div className="transition-transform duration-200 group-hover:rotate-12">
                      {link.icon}
                    </div>
                  </span>
                  {showExpandedView && <span>{link.label}</span>}
                  {!showExpandedView && isActive && (
                    <span className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-md" />
                  )}
                </Link>
              );
            })}
            
            {/* Resumes Section (Only in expanded view) */}
            {showExpandedView && (
              <div className="mt-3">
                <button 
                  onClick={toggleResumesSection}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-base font-semibold text-slate-300 hover:bg-slate-700/60 hover:backdrop-blur-sm hover:text-white transition-all duration-200 hover:scale-105 group"
                >
                  <div className="flex items-center">
                    <div className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12">
                      <FileText className="h-5 w-5 text-slate-400 group-hover:text-white mr-3 transition-colors duration-200" />
                    </div>
                    <span>My Resumes</span>
                  </div>
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    {isResumesExpanded ? 
                      <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors duration-200" /> : 
                      <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors duration-200" />
                    }
                  </div>
                </button>
                
                {isResumesExpanded && (
                  <div className="ml-8 mt-2 space-y-2">
                    {isLoading && (
                      <div className="flex items-center space-x-2 py-2 px-3">
                        <div className="w-4 h-4 bg-blue-400 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-slate-400 rounded animate-pulse"></div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="text-sm text-red-400 py-2 px-3">
                        {error}
                      </div>
                    )}
                    
                    {!isLoading && !error && resumes.length === 0 && (
                      <div className="text-sm text-slate-400 font-medium py-2 px-3">
                        No resumes found
                      </div>
                    )}
                    
                    {resumes.map((resume) => (
                      <div key={resume.id} className="rounded-xl border border-slate-600/50 py-3 px-3 mb-2 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70 transition-all duration-200 hover:scale-105 hover:shadow-lg group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base font-medium text-white truncate max-w-[150px]">
                            {resume.title}
                          </span>
                          {resume.is_primary && (
                            <span className="bg-blue-900 text-blue-300 text-sm px-1.5 py-0.5 rounded-full font-medium">
                              Primary
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium text-slate-400 mb-2">
                          {new Date(resume.created_at).toLocaleDateString()}
                        </div>
                        
                        <div className="flex space-x-2">
                          {!resume.is_primary && (
                            <button 
                              onClick={() => handleSetPrimary(resume.id)}
                              className="p-1.5 rounded-lg bg-blue-800/60 text-blue-300 hover:bg-blue-700/80 backdrop-blur-sm transition-all duration-200 hover:scale-110 group/btn"
                              title="Set as primary"
                            >
                              <div className="transition-transform duration-200 group-hover/btn:rotate-180">
                                <Star className="h-3.5 w-3.5" />
                              </div>
                            </button>
                          )}
                          
                          <a 
                            href={resume.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-green-800/60 text-green-300 hover:bg-green-700/80 backdrop-blur-sm transition-all duration-200 hover:scale-110 group/btn"
                            title="Download"
                          >
                            <div className="transition-transform duration-200 group-hover/btn:-translate-y-1">
                              <Download className="h-3.5 w-3.5" />
                            </div>
                          </a>
                          
                          <button 
                            onClick={() => handleDeleteResume(resume.id)}
                            className="p-1.5 rounded-lg bg-red-800/60 text-red-300 hover:bg-red-700/80 backdrop-blur-sm transition-all duration-200 hover:scale-110 group/btn"
                            title="Delete"
                          >
                            <div className="transition-transform duration-200 group-hover/btn:rotate-12">
                              <Trash2 className="h-3.5 w-3.5" />
                            </div>
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
        <div className="p-4 border-t border-slate-700/50 bg-gradient-to-t from-slate-800/20 to-transparent">
          <button 
            onClick={handleResumeUploadOpen}
            className={`${
              showExpandedView 
                ? 'w-full flex items-center justify-center gap-2 py-3 px-3' 
                : 'p-3 rounded-full'
            } bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-700/90 hover:to-blue-800/90 text-white rounded-xl transition-all duration-200 text-base font-semibold backdrop-blur-sm border border-blue-500/30 hover:scale-105 hover:shadow-lg group`}
            aria-label="Upload Resume"
          >
            <div className="transition-transform duration-200 group-hover:rotate-180">
              <Plus className="h-5 w-5" />
            </div>
            {showExpandedView && <span>Upload Resume</span>}
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