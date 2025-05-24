import * as React from "react";
import { cn } from "../../lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-black shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[60px] resize-vertical",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea"; 