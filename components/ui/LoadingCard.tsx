import { cn } from "../../lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "card" | "inline" | "overlay";
}

const sizeClasses = {
  sm: "p-4",
  md: "p-6", 
  lg: "p-8"
};

export function LoadingCard({ 
  title = "Loading...",
  description,
  className,
  size = "md",
  variant = "card"
}: LoadingCardProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <LoadingSpinner size="sm" variant="primary" />
        <span className="text-gray-600">{title}</span>
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
          <LoadingSpinner size="lg" variant="primary" className="mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          {description && (
            <p className="text-gray-600 max-w-md">{description}</p>
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
      <LoadingSpinner size="lg" variant="primary" className="mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 max-w-md">{description}</p>
      )}
    </div>
  );
} 