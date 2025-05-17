import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link 
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
} 