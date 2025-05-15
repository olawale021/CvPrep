"use client";

import {
    BookOpen,
    Calendar,
    FileText,
    Home,
    LayoutDashboard,
    LineChart,
    LucideIcon,
    Settings,
    Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation item type
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// Define navigation sections
const mainNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Job Applications", href: "/applications", icon: BookOpen },
  { name: "Resume Builder", href: "/resume-builder", icon: FileText },
  { name: "Interview Prep", href: "/interview-prep", icon: Users },
  { name: "Cover Letter", href: "/cover-letter", icon: FileText },
  { name: "Career Roadmap", href: "/career-roadmap", icon: LineChart },
  { name: "Calendar", href: "/calendar", icon: Calendar },
];

const secondaryNav: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help Center", href: "/help", icon: Home },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  
  // Navigation item renderer
  const NavItem = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    
    return (
      <Link
        href={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive 
            ? "bg-blue-50 text-blue-700" 
            : "text-gray-700 hover:text-blue-700 hover:bg-gray-100"
        }`}
      >
        <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
        {item.name}
      </Link>
    );
  };
  
  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:min-h-0 border-r bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="px-4 space-y-1">
          {mainNav.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
        
        <div className="mt-auto pt-4 border-t">
          <div className="px-4 space-y-1">
            {secondaryNav.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 