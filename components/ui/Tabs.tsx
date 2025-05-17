import * as React from "react";
import { cn } from "../../lib/utils";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

// Define types for each component to help with proper prop passing
type TabsComponentProps = {
  value?: string;
  onValueChange?: (value: string) => void;
};

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        
        // Only pass value/onValueChange to TabsTrigger and TabsContent
        if (child.type === TabsTrigger || child.type === TabsContent) {
          return React.cloneElement(child as React.ReactElement<TabsComponentProps>, { 
            value, 
            onValueChange 
          });
        }
        
        // For other components, don't pass any special props
        return child;
      })}
    </div>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return <div className={cn("flex border-b mb-2", className)} {...props}>{children}</div>;
}

interface TabsTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onValueChange'> {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerExtendedProps extends TabsTriggerProps {
  value: string;
  onValueChange?: (value: string) => void;
}

export function TabsTrigger({ 
  value, 
  children, 
  className, 
  ...props 
}: TabsTriggerExtendedProps) {
  // Use type assertion with a more specific type
  const extendedProps = props as {
    value?: string;
    onValueChange?: (value: string) => void;
  } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onValueChange'>;
  
  const { value: activeValue, onValueChange, ...domProps } = extendedProps;
  
  // Determine if this tab is selected
  const isSelected = activeValue === value;
  
  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        isSelected ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200",
        className
      )}
      // Fix: Use data attribute instead of aria-selected
      data-state={isSelected ? "active" : "inactive"}
      onClick={() => onValueChange?.(value)}
      {...domProps}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'onValueChange'> {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentExtendedProps extends TabsContentProps {
  value: string;
  onValueChange?: (value: string) => void;
}

export function TabsContent({ 
  value, 
  children, 
  className,
  ...props 
}: TabsContentExtendedProps) {
  // Use type assertion with a more specific type
  const extendedProps = props as {
    value?: string;
    onValueChange?: (value: string) => void;
  } & Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'onValueChange'>;
  
  // We don't use onValueChange in this component, but need to extract it
  // to prevent it from being spread to the DOM element
  const { value: activeValue, ...domProps } = extendedProps;
  // Explicitly remove onValueChange from props to prevent it from reaching the DOM
  delete domProps.onValueChange;
  
  if (activeValue !== value) return null;
  
  return <div className={cn(className)} {...domProps}>{children}</div>;
} 