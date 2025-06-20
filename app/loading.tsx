import { LoadingCard } from "../components/ui/feedback/LoadingCard";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoadingCard 
        size="lg"
        className="max-w-md w-full"
        showDescription={true}
      />
    </div>
  );
} 