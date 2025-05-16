"use client";

import {
    Bell,
    Download,
    FolderClosed,
    GraduationCap,
    Home,
    LineChart,
    LogOut,
    MoreVertical,
    Plus,
    Search,
    Settings,
    Users,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserResumes, Resume } from "../../lib/resumeService";
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [userResumes, setUserResumes] = useState<Resume[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  
  const navLinks = [
    { href: "/dashboard", label: "Home", icon: <Home className="h-5 w-5" /> },
    { href: "/career-roadmap", label: "Progress Tracker", icon: <LineChart className="h-5 w-5" /> },
    { href: "/job-search", label: "Job Opportunities", icon: <GraduationCap className="h-5 w-5" /> },
    { href: "/community", label: "Community", icon: <Users className="h-5 w-5" /> },
    { href: "/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" />, badge: "02" },
  ];
  
  useEffect(() => {
    async function loadUserResumes() {
      if (user?.id) {
        setIsLoadingResumes(true);
        try {
          const { resumes, error } = await getUserResumes(user.id);
          if (error) {
            console.error('Failed to load resumes:', error);
          } else {
            setUserResumes(resumes);
          }
        } catch (err) {
          console.error('Error loading resumes:', err);
        } finally {
          setIsLoadingResumes(false);
        }
      }
    }
    
    loadUserResumes();
  }, [user?.id]);

  const handleResumeUploadOpen = () => {
    // Log user and session for debugging
    // console.log('Sidebar user:', user);
    // Session debug code commented out to avoid unused variable error
    // if (typeof window !== 'undefined' && window.localStorage) {
    //   const session = window.localStorage.getItem('supabase.auth.token');
    //   console.log('Sidebar session (from localStorage):', session);
    // }
    setShowResumeUpload(true);
  };

  const handleResumeUploadSuccess = () => {
    // Refresh the resume list when a new resume is uploaded
    if (user?.id) {
      getUserResumes(user.id).then(({ resumes }) => {
        setUserResumes(resumes);
      });
    }
  };

  return (
    <div className={`w-64 bg-white rounded-xl shadow-sm p-4 flex flex-col h-full ${className}`}>
      {/* Profile Section */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b">
        <div className="rounded-full overflow-hidden w-10 h-10 bg-lime-200">
          {user?.user_metadata?.avatar_url ? (
            <Image 
              src={user.user_metadata.avatar_url} 
              alt={user.user_metadata?.full_name || "User"} 
              width={40} 
              height={40} 
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-800 font-medium">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">
            {user?.user_metadata?.full_name || "User"}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {user?.email || ""}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      
      {/* Search */}
      <div className="mb-6 relative">
        <div className="flex items-center border rounded-lg bg-gray-50 px-3 py-2">
          <Search className="h-5 w-5 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent border-none w-full focus:outline-none text-sm"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="space-y-1 mb-6">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {link.icon}
              </span>
              {link.label}
              {link.badge && (
                <span className="ml-auto bg-lime-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* My Resumes */}
      <div className="mb-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">My Resumes</h3>
          <button 
            onClick={handleResumeUploadOpen}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Upload new resume"
          >
            <Plus className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-1">
          {isLoadingResumes ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading resumes...</div>
          ) : userResumes.length > 0 ? (
            userResumes.map((resume) => (
              <a
                key={resume.id}
                href={resume.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 group"
              >
                <div className="flex items-center overflow-hidden">
                  <FolderClosed className="h-4 w-4 text-gray-500 mr-3 flex-shrink-0" />
                  <span className="truncate">{resume.title}</span>
                  {resume.is_primary && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                <Download className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No resumes uploaded yet.</div>
          )}
        </div>
      </div>
      
      {/* Flex spacer */}
      <div className="flex-grow"></div>
      
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-lime-50 rounded-lg p-4 mb-2 relative border border-lime-200">
          <button 
            onClick={() => setShowWelcome(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
          <h4 className="font-medium text-gray-800 flex items-center">
            Welcome! <span className="ml-1">🎉</span>
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            We&apos;re excited to have you here. Build your resume, track your job applications, and land your dream job!
          </p>
        </div>
      )}
      
      {/* Resume Upload Dialog */}
      <ResumeUploadDialog 
        open={showResumeUpload} 
        onOpenChange={setShowResumeUpload} 
        onSuccess={handleResumeUploadSuccess}
      />
    </div>
  );
} 