'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function DashboardErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service (e.g., Sentry)
    console.error('Dashboard Route Error caught:', error);
  }, [error]);

  return (
    <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm my-4">
      <div className="flex items-center space-x-3 mb-3">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-800">Module Failed to Load</h3>
      </div>
      <p className="text-red-700 mb-4">
        An error occurred while loading this section of CrewFlow. Other system features remain operational.
      </p>
      <button
        onClick={() => reset()} // Re-renders the segment
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
