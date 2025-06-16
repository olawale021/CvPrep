import * as React from "react";
import { cn } from "../../../lib/core/utils";

export type AlertProps = React.HTMLAttributes<HTMLDivElement>;

export function Alert({ className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <h5 className={cn("font-semibold text-base mb-1", className)} {...props} />
  );
}

export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <p className={cn("text-sm text-gray-700", className)} {...props} />
  );
} 