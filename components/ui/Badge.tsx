import { cn } from "../../lib/utils";
import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "default" && "bg-blue-600 text-white",
        variant === "secondary" && "bg-blue-100 text-blue-700",
        variant === "outline" && "border border-gray-300 text-gray-700 bg-white",
        className
      )}
      {...props}
    />
  );
} 