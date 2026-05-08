
'use client';

import { useEffect, useState } from 'react';
import { MainHeader } from '@/components/main-header';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FriendRequests } from '@/components/friends/friend-requests';
import { FriendsList } from '@/components/friends/friends-list';
import { FriendLeaderboard } from '@/components/friends/friend-leaderboard';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, WifiOff, UserPlus, RefreshCw, Trophy, Users } from 'lucide-react';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
            
            const friendshipId = user.uid < friendId ? `${user.uid}_${friendId}` : `${friendId}_${user.uid}`;
            const friendshipRef = doc(firestore, 'friendships', friendshipId);
            
            // Check if exists
            const existing = await getDocs(query(collection(firestore, 'friendships'), where('userIds', 'array-contains', user.uid)));
            const alreadyConnected = existing.docs.some(d => d.data().userIds.includes(friendId));

            if (alreadyConnected) {
                 toast({ variant: "destructive", title: "Already Connected", description: "You are already friends or have a pending request." });
                 setIsSendingRequest(false);
                 return;
            }

            const batch = writeBatch(firestore);
            batch.set(friendshipRef, {
                id: friendshipId,
                userIds: [user.uid, friendId].sort(),
                status: 'pending',
                requesterId: user.uid,
                createdAt: serverTimestamp()
            });

            const notificationRef = doc(collection(firestore, 'users', friendId, 'notifications'));
            batch.set(notificationRef, {
                type: 'friend_request',
                fromUserId: user.uid,
                title: 'New Friend Request',
                message: `${user.displayName || 'A user'} sent you a friend request!`,
                isRead: false,
                createdAt: serverTimestamp(),
            });
    
            await batch.commit();
            toast({ title: 'Friend Request Sent!', description: `Request sent to ${friendData.username}.` });
            setFriendUsername('');

        } catch (error) {
            console.error("Error sending friend request:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to send request." });
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
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 space-y-8 pb-24 sm:pb-8">
                <Card className={!isOnline ? "opacity-75 grayscale-[0.5] pointer-events-none" : "border-primary/20 shadow-lg"}>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="text-primary" />
                            Connect with Scholars
                            {!isOnline && <WifiOff className="w-4 h-4 text-orange-500" />}
                        </CardTitle>
                        <CardDescription>
                            Enter a friend's exact username to challenge them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 p-1 border rounded-xl bg-secondary/20 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                            <Input 
                                value={friendUsername}
                                onChange={(e) => setFriendUsername(e.target.value)}
                                className="border-none bg-transparent focus-visible:ring-0 text-base h-11" 
                                placeholder="Exact Username"
                                disabled={isSendingRequest || !isOnline}
                            />
                            <Button onClick={handleSendRequest} disabled={!friendUsername.trim() || isSendingRequest || !isOnline} className="h-11 px-6 rounded-lg font-bold">
                                {isSendingRequest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                                {isSendingRequest ? 'Sending...' : 'Add Friend'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="network" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                        <TabsTrigger value="network" className="gap-2"><Users className="w-4 h-4"/> Network</TabsTrigger>
                        <TabsTrigger value="leaderboard" className="gap-2"><Trophy className="w-4 h-4"/> Rankings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="network" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FriendRequests currentUserId={user.uid} />
                            <FriendsList currentUserId={user.uid} />
                        </div>
                    </TabsContent>

                    <TabsContent value="leaderboard" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <FriendLeaderboard currentUserId={user.uid} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
