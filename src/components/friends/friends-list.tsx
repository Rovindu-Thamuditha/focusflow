
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, deleteDoc, limit, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trash2, Timer, Lock } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';

interface Friend {
    id: string;
    username?: string;
    photoURL?: string;
    totalFocusMins?: number;
    shareTotalFocusTime?: boolean;
}

export function FriendsList({ currentUserId }: { currentUserId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [friends, setFriends] = useState<Friend[]>([]);
    
    const friendsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'friendships'),
            where('userIds', 'array-contains', currentUserId),
            where('status', '==', 'accepted'),
            limit(50)
        );
    }, [firestore, currentUserId]);

    const { data: acceptedFriendships, isLoading } = useCollection<any>(friendsQuery);

    useEffect(() => {
        const fetchFriendData = async () => {
            if (!acceptedFriendships || !firestore) return;

            const friendPromises = acceptedFriendships.map(async (friendship) => {
                const friendId = friendship.userIds.find((id: string) => id !== currentUserId);
                if (!friendId) return null;
                
                const userDocRef = doc(firestore, 'users', friendId);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) return null;

                const userData = userDoc.data();
                const privacy = userData.privacy || {};
                
                let totalMins = 0;
                if (privacy.shareTotalFocusTime) {
                    const summariesRef = collection(firestore, 'users', friendId, 'daily_summaries');
                    const summarySnap = await getDocs(query(summariesRef, orderBy('date', 'desc'), limit(7)));
                    summarySnap.forEach(d => totalMins += (d.data().totalMinutes || 0));
                }

                return { 
                    id: userDoc.id, 
                    ...userData, 
                    totalFocusMins: totalMins,
                    shareTotalFocusTime: !!privacy.shareTotalFocusTime
                } as Friend;
            });
            
            const resolvedFriends = (await Promise.all(friendPromises)).filter(Boolean) as Friend[];
            setFriends(resolvedFriends);
        };

        fetchFriendData();
    }, [acceptedFriendships, firestore, currentUserId]);

    const removeFriend = async (friendId: string) => {
        if (!acceptedFriendships || !firestore) return;
        const friendshipDoc = acceptedFriendships.find((f: any) => f.userIds.includes(friendId));
        if (!friendshipDoc) return;

        try {
            await deleteDoc(doc(firestore, 'friendships', friendshipDoc.id));
            toast({ title: "Friend Removed" });
        } catch (error) {
            console.error("Error removing friend:", error);
            toast({ variant: 'destructive', title: 'Error' });
        }
    };

    const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };
    
    return (
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="text-primary" /> Accountability Circle</CardTitle>
                <CardDescription>Your verified study partners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading && <p className="text-sm text-muted-foreground animate-pulse">Loading friends...</p>}
                {!isLoading && friends.length === 0 && <p className="text-sm text-muted-foreground italic">You are currently studying solo. Add a friend to compare hours!</p>}
                {friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/50 group transition-all hover:bg-secondary/50">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                                <AvatarImage src={friend.photoURL} alt={friend.username} />
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{getInitials(friend.username)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{friend.username || 'Anonymous Scholar'}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                    <Timer className="w-3 h-3 text-accent" />
                                    {friend.shareTotalFocusTime ? (
                                        <span>7D: <span className="text-foreground">{formatTime(friend.totalFocusMins || 0)}</span></span>
                                    ) : (
                                        <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Private</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Disconnect Partnership?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Remove {friend.username} from your network? You will no longer be able to compare study hours.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Friend</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => removeFriend(friend.id)} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
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
