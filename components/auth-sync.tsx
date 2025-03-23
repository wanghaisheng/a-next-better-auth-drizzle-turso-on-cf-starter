"use client";

import { useEffect, useState } from "react";
import { saveUserProfile, registerConnectivityListeners, isOnline } from "@/lib/pwa/offline-storage";

type AuthSyncProps = {
  user: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
};

export function AuthSync({ user }: AuthSyncProps) {
  const [online, setOnline] = useState(() => isOnline());

  useEffect(() => {
    // Handle offline status changes
    const cleanup = registerConnectivityListeners(
      () => {
        setOnline(true);
        console.log("Back online");
      },
      () => {
        setOnline(false);
        console.log("Offline mode activated");
      }
    );

    // Only save non-sensitive user data when logged in
    if (user) {
      saveUserProfile({
        id: user.id,
        name: user.name,
        email: user.email,
      }).catch(console.error);
    }

    return cleanup;
  }, [user]);

  // Show an offline indicator when the user is offline
  if (!online) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md shadow-md flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M2.458 3.292A1 1 0 012.998 3h14.004a1 1 0 01.54 1.832L10.706 9.67l-7.168-6.193a1 1 0 01-.08-1.185z"
            clipRule="evenodd"
          />
          <path
            fillRule="evenodd"
            d="M10 12a1 1 0 01.75.34l7.633 8.39a1 1 0 01-.083 1.37 1 1 0 01-.74.298H3.44a1 1 0 01-.698-1.716l6.53-7.104A1 1 0 0110 12z"
            clipRule="evenodd"
          />
        </svg>
        <span>You are currently offline</span>
      </div>
    );
  }

  // This is a non-visual component when online
  return null;
}
