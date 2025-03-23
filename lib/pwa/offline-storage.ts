"use client";

// Simplified type for user profile
type UserProfile = {
  id: string;
  name?: string | null;
  email: string;
  // Only include non-sensitive fields
};

// IndexedDB database name and version
const DB_NAME = 'better-auth-offline-db';
const DB_VERSION = 1;

// Initialize the database
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available on server'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle errors
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    // Handle successful database open
    request.onsuccess = () => {
      resolve(request.result);
    };

    // Database initialization/upgrade
    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Create object stores
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' });
      }

      // Add more object stores as needed
    };
  });
}

// Save user profile for offline access
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('userProfile', 'readwrite');
      const store = transaction.objectStore('userProfile');

      const request = store.put(profile);

      request.onerror = () => {
        reject(new Error('Failed to save user profile'));
      };

      transaction.oncomplete = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error saving profile to IndexedDB:', error);
    throw error;
  }
}

// Get user profile from IndexedDB
export async function getUserProfile(id: string): Promise<UserProfile | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('userProfile', 'readonly');
      const store = transaction.objectStore('userProfile');

      const request = store.get(id);

      request.onerror = () => {
        reject(new Error('Failed to get user profile'));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  } catch (error) {
    console.error('Error retrieving profile from IndexedDB:', error);
    return null;
  }
}

// Check if we're online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Register for online/offline events
export function registerConnectivityListeners(
  onlineCallback: () => void,
  offlineCallback: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Add event listeners
  window.addEventListener('online', onlineCallback);
  window.addEventListener('offline', offlineCallback);

  // Return a cleanup function
  return () => {
    window.removeEventListener('online', onlineCallback);
    window.removeEventListener('offline', offlineCallback);
  };
}
