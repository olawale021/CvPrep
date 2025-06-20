import { cn } from "../../../lib/core/utils";

interface LoadingCardProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "card" | "inline" | "overlay";
  showDescription?: boolean;
}

const sizeClasses = {
  sm: "p-4",
  md: "p-6", 
  lg: "p-8"
};

export function LoadingCard({ 
  className,
  size = "md",
  variant = "card",
  showDescription = true
}: LoadingCardProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <div className="h-4 w-4 bg-blue-600 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className={cn(
        "absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50",
        className
      )}>
        <div className="text-center">
          <div className="h-8 w-8 bg-blue-600 rounded animate-pulse mb-4 mx-auto" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2 mx-auto"></div>
          {showDescription && (
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center",
      sizeClasses[size],
      className
    )}>
      <div className="h-8 w-8 bg-blue-600 rounded animate-pulse mb-4" />
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
      {showDescription && (
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
      )}
    </div>
  );
} 