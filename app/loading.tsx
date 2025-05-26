import { LoadingCard } from "../components/ui/LoadingCard";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoadingCard 
        title="Loading CareerPal..."
        description="Please wait while we prepare your workspace"
        size="lg"
        className="max-w-md w-full"
      />
    </div>
  );
} 