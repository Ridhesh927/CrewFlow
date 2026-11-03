"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { GoogleOAuthProvider } from "@react-oauth/google";

const rawGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!rawGoogleClientId) {
  throw new Error(
    "Configuration error: Missing required environment variable NEXT_PUBLIC_GOOGLE_CLIENT_ID. Google OAuth cannot initialize without a valid client ID."
  );
}

const googleClientId: string = rawGoogleClientId;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            throwOnError: false, // Components handle errors via isError/error query state
          },
        },
      })
  );

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
