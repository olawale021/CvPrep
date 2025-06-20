export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          There was an error processing your authentication request. Please try signing in again.
        </p>
        <a 
          href="/login" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Try Again
        </a>
      </div>
    </div>
  )
} 