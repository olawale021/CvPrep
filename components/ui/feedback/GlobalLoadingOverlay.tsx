"use client";

import { useLoading } from "../../../context/LoadingContext";
import { ProgressBar } from "./ProgressBar";

interface GlobalLoadingOverlayProps {
  criticalOperations?: string[];
}

export function GlobalLoadingOverlay({ 
  criticalOperations = ['auth', 'navigation', 'critical'] 
}: GlobalLoadingOverlayProps) {
  const { loadingStates } = useLoading();
  
  // Check if any critical operations are loading
  const criticalLoading = criticalOperations.some(op => 
    loadingStates[op]?.isLoading
  );
  
  if (!criticalLoading) return null;
  
  // Get the first critical operation that's loading
  const activeOperation = criticalOperations.find(op => 
    loadingStates[op]?.isLoading
  );
  
  const state = activeOperation ? loadingStates[activeOperation] : null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {state?.message || "Loading..."}
            </h3>
            <p className="text-gray-600">
              Please wait while we process your request
            </p>
          </div>
          
          {state?.progress !== undefined && (
            <ProgressBar 
              value={state.progress} 
              showPercentage 
              className="mb-4"
            />
          )}
          
          <div className="text-sm text-gray-500">
            This may take a few moments
          </div>
        </div>
      </div>
    </div>
  );
} 