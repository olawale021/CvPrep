import * as React from "react";
import { cn } from "../../lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, className, ...props }, ref) => (
    <label className={cn("inline-flex items-center cursor-pointer", className)}>
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={e => onCheckedChange(e.target.checked)}
        className="sr-only peer"
        {...props}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
      <div className={cn(
        "absolute w-5 h-5 bg-white border border-gray-300 rounded-full left-1 top-0.5 transition-transform",
        checked ? "translate-x-5 border-blue-600" : ""
      )}></div>
    </label>
  )
);
Switch.displayName = "Switch"; 