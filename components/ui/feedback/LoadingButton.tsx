import { cn } from "../../../lib/core/utils";
import { Button, ButtonProps } from "../base/Button";

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
        <div className="h-4 w-4 bg-white/30 rounded animate-pulse mr-2" />
      )}
      {loading ? (loadingText || "Loading...") : children}
    </Button>
  );
} 