
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';

interface Friendship {
    id: string;
    userIds: string[];
    requesterId: string;
    status: 'pending' | 'accepted' | 'declined';
}

interface AppUser {
    id: string;
    username?: string;
    photoURL?: string;
}

interface FriendRequest extends Friendship {
    requester: AppUser | null;
}

export function FriendRequests({ currentUserId }: { currentUserId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [requestsWithUserData, setRequestsWithUserData] = useState<FriendRequest[]>([]);
    
    const requestsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'friendships'),
            where('userIds', 'array-contains', currentUserId),
            where('status', '==', 'pending'),
            limit(50)
        );
    }, [firestore, currentUserId]);

    const { data: pendingRequests, isLoading } = useCollection<Friendship>(requestsQuery);

    useEffect(() => {
        const fetchRequesterData = async () => {
            if (!pendingRequests || !firestore) return;

            const enrichedRequests = await Promise.all(
                pendingRequests
                    .filter(req => req.requesterId !== currentUserId) // Only show requests sent by others
                    .map(async (req) => {
                        const userDocRef = doc(firestore, 'users', req.requesterId);
                        const userDoc = await getDoc(userDocRef);
                        return {
                            ...req,
                            requester: userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as AppUser : null
                        };
                    })
            );
            setRequestsWithUserData(enrichedRequests.filter(req => req.requester !== null));
        };

        fetchRequesterData();
    }, [pendingRequests, firestore, currentUserId]);
    
    const handleRequest = async (request: FriendRequest, action: 'accept' | 'decline') => {
        if (!firestore || !request.requester) return;

        const requestDocRef = doc(firestore, 'friendships', request.id);
        
        try {
            if (action === 'accept') {
                const batch = writeBatch(firestore);

                // Update friendship status
                batch.update(requestDocRef, { status: 'accepted' });

                // Create a notification for the original requester
                const notificationRef = doc(collection(firestore, 'users', request.requesterId, 'notifications'));
                batch.set(notificationRef, {
                    type: 'friend_accept',
                    fromUserId: currentUserId,
                    title: 'Friend Request Accepted',
                    message: `Your friend request was accepted!`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });

                await batch.commit();
                toast({ title: 'Friend Request Accepted!' });
            } else {
                // Just delete the friendship document on decline
                await deleteDoc(requestDocRef);
                toast({ title: 'Friend Request Declined' });
            }
        } catch (error) {
            console.error(`Error handling friend request:`, error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not process the request.' });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock /> Pending Requests</CardTitle>
                <CardDescription>Accept or decline friend requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <p className="text-sm text-muted-foreground">Loading requests...</p>}
                {!isLoading && requestsWithUserData.length === 0 && <p className="text-sm text-muted-foreground">No pending friend requests.</p>}
                {requestsWithUserData.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={req.requester?.photoURL} alt={req.requester?.username} />
                                <AvatarFallback>{getInitials(req.requester?.username)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{req.requester?.username || 'A user'}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => handleRequest(req, 'accept')}>
                                <Check className="w-4 h-4" />
                            </Button>
                             <Button size="icon" className="h-8 w-8" variant="destructive" onClick={() => handleRequest(req, 'decline')}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

    