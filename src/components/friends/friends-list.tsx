
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trash2, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Friendship {
    id: string;
    userIds: string[];
    status: 'pending' | 'accepted' | 'declined';
}

interface AppUser {
    id: string;
    username?: string;
}

interface Friend extends AppUser {}

export function FriendsList({ currentUserId }: { currentUserId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [friends, setFriends] = useState<Friend[]>([]);
    
    const friendsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'friendships'),
            where('userIds', 'array-contains', currentUserId),
            where('status', '==', 'accepted')
        );
    }, [firestore, currentUserId]);

    const { data: acceptedFriendships, isLoading } = useCollection<Friendship>(friendsQuery);

    useEffect(() => {
        const fetchFriendData = async () => {
            if (!acceptedFriendships || !firestore) return;

            const friendPromises = acceptedFriendships.map(async (friendship) => {
                const friendId = friendship.userIds.find(id => id !== currentUserId);
                if (!friendId) return null;
                
                const userDocRef = doc(firestore, 'users', friendId);
                const userDoc = await getDoc(userDocRef);
                return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as Friend : null;
            });
            
            const resolvedFriends = (await Promise.all(friendPromises)).filter(Boolean) as Friend[];
            setFriends(resolvedFriends);
        };

        fetchFriendData();
    }, [acceptedFriendships, firestore, currentUserId]);

    const removeFriend = async (friendId: string) => {
        if (!acceptedFriendships) return;
        
        const friendshipDoc = acceptedFriendships.find(f => f.userIds.includes(friendId));
        if (!friendshipDoc || !firestore) return;

        try {
            await deleteDoc(doc(firestore, 'friendships', friendshipDoc.id));
            toast({ title: "Friend Removed", description: "This user has been removed from your friends list." });
        } catch (error) {
            console.error("Error removing friend:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove friend.' });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Your Friends</CardTitle>
                <CardDescription>Your accountability circle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <p>Loading friends...</p>}
                {!isLoading && friends.length === 0 && <p className="text-sm text-muted-foreground">You haven't added any friends yet.</p>}
                {friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <span className="font-medium">{friend.username || 'A Friend'}</span>
                        <div className="flex gap-2">
                             <Link href={`/compare/${friend.id}`}>
                                <Button size="icon" className="h-8 w-8" variant="outline">
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </Link>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="icon" className="h-8 w-8" variant="destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove {friend.username || 'this user'} from your friends list. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => removeFriend(friend.id)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
