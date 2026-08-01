'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function GlobalErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Route Error caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="text-gray-600">
          A critical error occurred. Please try reloading the page.
        </p>
        <div className="pt-4">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
