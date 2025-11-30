'use client';

import { useUser as useFirebaseUserHook } from '@/firebase';
/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = useFirebaseUserHook;
