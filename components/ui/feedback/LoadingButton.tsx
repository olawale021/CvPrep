import { cn } from "../../../lib/core/utils";
import { Button, ButtonProps } from "../base/Button";
import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={cn(
        "relative",
        loading && "cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          variant="white" 
          className="mr-2" 
        />
      )}
      {loading ? (loadingText || "Loading...") : children}
    </Button>
  );
} 