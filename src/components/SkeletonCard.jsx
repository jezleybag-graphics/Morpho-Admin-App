// Add this component near your imports or in a separate file
const SkeletonCard = () => (
  <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 animate-pulse h-full">
    <div className="flex justify-between mb-4">
      <div className="space-y-2">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-3 w-32 bg-gray-200 rounded"></div>
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="h-3 w-full bg-gray-200 rounded"></div>
      <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
    </div>
    <div className="mt-auto pt-4 border-t border-gray-100">
      <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);