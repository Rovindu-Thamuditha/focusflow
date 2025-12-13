
'use client';

import { useEffect } from 'react';
import { MainHeader } from '@/components/main-header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FriendRequests } from '@/components/friends/friend-requests';
import { FriendsList } from '@/components/friends/friends-list';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { InviteCodeHandler } from '@/components/friends-ui/InviteCodeHandler';

export default function FriendsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    
    useEffect(() => {
        if (isUserLoading) return;
        if (!user || user.isAnonymous) {
            router.push('/login');
            return;
        }
    }, [user, isUserLoading, router]);


    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <GridFocusLoader />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader totalFocusedTime={0} showBackButton />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Add Friends</CardTitle>
                        <CardDescription>Enter a friend's username below to send a request.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <InviteCodeHandler />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <FriendRequests currentUserId={user.uid} />
                    <FriendsList currentUserId={user.uid} />
                </div>
            </main>
        </div>
    )
}
