
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Skeleton - Hidden on mobile, visible on desktop */}
      <div className="hidden md:block w-64 bg-gray-200 animate-pulse"></div>
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header Skeleton - Responsive text sizes */}
          <div className="mb-8 md:mb-10">
            <div className="h-6 md:h-8 w-64 md:w-80 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 md:h-4 w-72 md:w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Usage Tracker Skeleton - Responsive padding */}
          <div className="mb-8 md:mb-10">
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 md:h-6 w-24 md:w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 md:h-8 w-16 md:w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 md:h-4 w-36 md:w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Quick Actions Section Skeleton - Responsive grid and padding */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 border border-gray-200 mb-8 md:mb-10">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 md:h-8 w-48 md:w-80 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Responsive grid: 1 column on mobile, 3 on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Primary Action Skeleton - Full width on mobile, 2 columns on desktop */}
              <div className="md:col-span-2">
                <div className="bg-gray-300 rounded-xl md:rounded-2xl p-4 md:p-6 h-40 md:h-48">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-400 rounded-lg md:rounded-xl animate-pulse"></div>
                    <div className="h-4 md:h-6 w-20 md:w-24 bg-gray-400 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 md:h-8 w-48 md:w-64 bg-gray-400 rounded animate-pulse mb-2"></div>
                  <div className="h-3 md:h-4 w-full bg-gray-400 rounded animate-pulse mb-3 md:mb-4"></div>
                  <div className="h-4 md:h-6 w-24 md:w-32 bg-gray-400 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Secondary Actions Skeleton - Stack on mobile, column on desktop */}
              <div className="space-y-3 md:space-y-4">
                <div className="bg-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 h-20 md:h-24">
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="w-7 h-7 md:w-9 md:h-9 bg-gray-300 rounded-md md:rounded-lg animate-pulse"></div>
                    <div className="h-4 md:h-5 w-24 md:w-32 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="h-3 md:h-4 w-32 md:w-40 bg-gray-300 rounded animate-pulse"></div>
                </div>

                <div className="bg-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 h-20 md:h-24">
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="w-7 h-7 md:w-9 md:h-9 bg-gray-300 rounded-md md:rounded-lg animate-pulse"></div>
                    <div className="h-4 md:h-5 w-28 md:w-36 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="h-3 md:h-4 w-36 md:w-44 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section Grid Skeleton - Stack on mobile, side-by-side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Saved Resumes Section Skeleton - Full width on mobile/tablet, 2/3 on large screens */}
            <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="h-5 md:h-7 w-32 md:w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 md:h-4 w-12 md:w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 md:h-5 w-2/3 md:w-3/4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 md:h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-2 md:h-3 w-1/3 md:w-1/2 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-3 md:h-4 w-10 md:w-12 bg-gray-200 rounded animate-pulse ml-3 md:ml-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Upcoming Section Skeleton - Full width on mobile/tablet, 1/3 on large screens */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="h-5 md:h-7 w-20 md:w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 md:h-4 w-16 md:w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="flex flex-col items-center justify-center py-6 md:py-8 lg:py-12 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-xl md:rounded-2xl mb-3 md:mb-4 animate-pulse"></div>
                <div className="h-4 md:h-6 w-24 md:w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 md:h-4 w-36 md:w-48 bg-gray-200 rounded animate-pulse mb-3 md:mb-4"></div>
                <div className="h-6 md:h-8 w-20 md:w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 