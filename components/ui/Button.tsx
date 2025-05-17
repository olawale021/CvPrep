import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          
          // Variant styles
          variant === "default" && "bg-blue-600 text-white hover:bg-blue-700",
          variant === "destructive" && "bg-red-600 text-white hover:bg-red-700",
          variant === "outline" && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
          variant === "ghost" && "hover:bg-gray-100 hover:text-gray-900",
          variant === "link" && "underline-offset-4 hover:underline text-blue-600",
          
          // Size styles
          size === "default" && "h-10 py-2 px-4 text-sm",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-12 px-8 text-base",
          size === "icon" && "h-10 w-10",
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
