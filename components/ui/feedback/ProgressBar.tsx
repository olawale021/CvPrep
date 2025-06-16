import { cn } from "../../../lib/core/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showPercentage?: boolean;
  label?: string;
}

const sizeClasses = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4"
};

const variantClasses = {
  default: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-yellow-600",
  error: "bg-red-600"
};

export function ProgressBar({
  value,
  className,
  size = "md",
  variant = "default",
  showPercentage = false,
  label
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(clampedValue)}%</span>
          )}
        </div>
      )}
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
              index < currentStep 
                ? "bg-green-600 text-white" 
                : index === currentStep
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            )}>
              {index < currentStep ? "✓" : index + 1}
            </div>
            <span className={cn(
              "text-xs text-center max-w-20",
              index <= currentStep ? "text-gray-900" : "text-gray-500"
            )}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <ProgressBar 
        value={(currentStep / (steps.length - 1)) * 100} 
        variant={currentStep === steps.length - 1 ? "success" : "default"}
      />
    </div>
  );
} 