import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "white";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

const variantClasses = {
  default: "text-gray-600",
  primary: "text-blue-600",
  secondary: "text-gray-400",
  white: "text-white"
};

export function LoadingSpinner({ 
  size = "md", 
  variant = "default", 
  className 
}: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizeClasses[size],
        variantClasses[variant],
        className
      )} 
    />
  );
} 