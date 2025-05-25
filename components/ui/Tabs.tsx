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
        
        // For direct children, pass down value and onValueChange
        const childWithProps = React.cloneElement(child as React.ReactElement<TabsComponentProps>, { 
          value, 
          onValueChange 
        });
        
        return childWithProps;
      })}
    </div>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function TabsList({ children, className, value, onValueChange, ...props }: TabsListProps) {
  // Pass down value and onValueChange to TabsTrigger children
  const childrenWithProps = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    
    return React.cloneElement(child as React.ReactElement<TabsComponentProps>, {
      value,
      onValueChange
    });
  });
  
  return <div className={cn("flex border-b mb-2", className)} {...props}>{childrenWithProps}</div>;
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
      onClick={() => {
        if (onValueChange) {
          onValueChange(value);
        }
      }}
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
  
  const isActive = activeValue === value;
  
  if (!isActive) {
    return null;
  }
  
  return (
    <div 
      className={cn("block", className)}
      data-state="active"
      data-tab-content={value}
      {...domProps}
    >
      {children}
    </div>
  );
} 