
'use client';

import { useEffect, useState } from 'react';
import { MainHeader } from '@/components/main-header';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FriendRequests } from '@/components/friends/friend-requests';
import { FriendsList } from '@/components/friends/friends-list';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, WifiOff, UserPlus, RefreshCw } from 'lucide-react';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';

export default function FriendsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const isOnline = useOnlineStatus();
    const [friendUsername, setFriendUsername] = useState('');
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    
    useEffect(() => {
        if (isUserLoading) return;
        if (!user || user.isAnonymous) {
            router.push('/login');
            return;
        }
    }, [user, isUserLoading, router]);

    const handleSendRequest = async () => {
        const targetUsername = friendUsername.trim();
        if (!firestore || !user || !targetUsername || !isOnline) return;

        setIsSendingRequest(true);
        try {
            const usersRef = collection(firestore, 'users');
            // Try to find by exact match, or lowercase if standardized
            const q = query(usersRef, where('username', '==', targetUsername));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: "destructive", title: "User Not Found", description: "No user found with that exact username. Usernames are case-sensitive." });
                setIsSendingRequest(false);
                return;
            }

            const friendDoc = querySnapshot.docs[0];
            const friendId = friendDoc.id;
            const friendData = friendDoc.data();

            if (friendId === user.uid) {
                toast({ variant: "destructive", title: "Oops!", description: "You can't add yourself as a friend." });
                setIsSendingRequest(false);
                return;
            }
            
            const friendshipsRef = collection(firestore, 'friendships');
            const sortedUserIds = [user.uid, friendId].sort();
            const qExisting = query(friendshipsRef, where('userIds', '==', sortedUserIds));
            const existingSnapshot = await getDocs(qExisting);
            
            if (!existingSnapshot.empty) {
                 toast({ variant: "destructive", title: "Already Connected", description: "You are already friends or have a pending request with this user." });
                 setIsSendingRequest(false);
                 return;
            }

            const batch = writeBatch(firestore);
            const newFriendshipRef = doc(collection(firestore, 'friendships'));
            batch.set(newFriendshipRef, {
                userIds: sortedUserIds,
                status: 'pending',
                requesterId: user.uid,
                createdAt: serverTimestamp()
            });

            const notificationRef = doc(collection(firestore, 'users', friendId, 'notifications'));
            const notificationData = {
                type: 'friend_request',
                fromUserId: user.uid,
                title: 'New Friend Request',
                message: `${user.displayName || 'A new user'} sent you a friend request!`,
                isRead: false,
                createdAt: serverTimestamp(),
            };
            batch.set(notificationRef, notificationData);
    
            await batch.commit();

            toast({ title: 'Friend Request Sent!', description: `Your request to ${friendData.username} has been sent.` });
            setFriendUsername('');

        } catch (error) {
            console.error("Error sending friend request:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to send friend request. Check your connection." });
        } finally {
            setIsSendingRequest(false);
        }
    };

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
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 space-y-8">
                <Card className={!isOnline ? "opacity-75 grayscale-[0.5] pointer-events-none" : "border-primary/20 shadow-lg"}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="text-primary" />
                            Add Friends 
                            {!isOnline && <WifiOff className="w-4 h-4 text-orange-500" />}
                        </CardTitle>
                        <CardDescription>
                            {isOnline 
                                ? "Enter a friend's exact username below to send a request." 
                                : "Internet connection required to find and add new friends."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 p-1 border rounded-lg bg-secondary/30 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                            <Input 
                                value={friendUsername}
                                onChange={(e) => setFriendUsername(e.target.value)}
                                className="border-none bg-transparent focus-visible:ring-0 text-base" 
                                placeholder="Username (case-sensitive)"
                                disabled={isSendingRequest || !isOnline}
                            />
                            <Button onClick={handleSendRequest} disabled={!friendUsername.trim() || isSendingRequest || !isOnline} className="gap-2">
                                {isSendingRequest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                                {isSendingRequest ? 'Sending...' : 'Add'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FriendRequests currentUserId={user.uid} />
                    <FriendsList currentUserId={user.uid} />
                </div>
            </main>
        </div>
    )
}
