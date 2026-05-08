'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, getDoc, limit, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';
import { Trophy, Medal, Timer, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { GridFocusLoader } from '../grid-focus-loader';

interface LeaderboardEntry {
    id: string;
    username: string;
    photoURL?: string;
    totalFocusMins: number;
    isCurrentUser: boolean;
}

export function FriendLeaderboard({ currentUserId }: { currentUserId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const friendsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'friendships'),
            where('userIds', 'array-contains', currentUserId),
            where('status', '==', 'accepted'),
            limit(50)
        );
    }, [firestore, currentUserId]);

    const { data: acceptedFriendships } = useCollection<any>(friendsQuery);

    useEffect(() => {
        const fetchAllStats = async () => {
            if (!firestore || !user) return;
            setIsLoading(true);

            try {
                // 1. Get Current User Stats
                let myMins = 0;
                const mySummaries = await getDocs(query(collection(firestore, 'users', user.uid, 'daily_summaries'), orderBy('date', 'desc'), limit(7)));
                mySummaries.forEach(d => myMins += (d.data().totalMinutes || 0));

                const leaderboard: LeaderboardEntry[] = [{
                    id: user.uid,
                    username: user.displayName || 'You',
                    photoURL: user.photoURL || '',
                    totalFocusMins: myMins,
                    isCurrentUser: true
                }];

                // 2. Get Friends Stats
                if (acceptedFriendships) {
                    const friendPromises = acceptedFriendships.map(async (friendship: any) => {
                        const friendId = friendship.userIds.find((id: string) => id !== currentUserId);
                        if (!friendId) return null;
                        
                        const friendDoc = await getDoc(doc(firestore, 'users', friendId));
                        if (!friendDoc.exists()) return null;
                        
                        const friendData = friendDoc.data();
                        if (!friendData.privacy?.shareTotalFocusTime) return null;

                        let friendMins = 0;
                        const fSummaries = await getDocs(query(collection(firestore, 'users', friendId, 'daily_summaries'), orderBy('date', 'desc'), limit(7)));
                        fSummaries.forEach(d => friendMins += (d.data().totalMinutes || 0));

                        return {
                            id: friendId,
                            username: friendData.username || 'Scholar',
                            photoURL: friendData.photoURL || '',
                            totalFocusMins: friendMins,
                            isCurrentUser: false
                        };
                    });

                    const resolved = await Promise.all(friendPromises);
                    resolved.forEach(res => { if(res) leaderboard.push(res); });
                }

                setEntries(leaderboard.sort((a, b) => b.totalFocusMins - a.totalFocusMins));
            } catch (e) {
                console.error("Leaderboard fetch error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllStats();
    }, [acceptedFriendships, firestore, user, currentUserId]);

    const maxMins = useMemo(() => Math.max(...entries.map(e => e.totalFocusMins), 60), [entries]);

    const formatHours = (mins: number) => (mins / 60).toFixed(1);

    if (isLoading) {
        return (
            <Card className="border-dashed border-primary/20">
                <CardContent className="h-64 flex items-center justify-center">
                    <GridFocusLoader />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20 shadow-xl overflow-hidden bg-card/30 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> Focus Leaderboard</CardTitle>
                <CardDescription>Top scholars in your network (Past 7 Days).</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                    {entries.map((entry, index) => (
                        <div 
                            key={entry.id} 
                            className={`p-4 flex items-center gap-4 transition-colors ${entry.isCurrentUser ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                        >
                            <div className="flex flex-col items-center justify-center w-8">
                                {index === 0 ? <Medal className="w-6 h-6 text-yellow-500" /> : 
                                 index === 1 ? <Medal className="w-5 h-5 text-slate-300" /> :
                                 index === 2 ? <Medal className="w-5 h-5 text-orange-400" /> :
                                 <span className="font-mono text-sm font-bold text-muted-foreground">{index + 1}</span>}
                            </div>
                            
                            <Avatar className={`h-12 w-12 border-2 ${entry.isCurrentUser ? 'border-primary' : 'border-transparent'}`}>
                                <AvatarImage src={entry.photoURL} />
                                <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(entry.username)}</AvatarFallback>
                            </Avatar>

                            <div className="flex-grow space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <p className={`font-bold text-sm ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                                        {entry.username} {entry.isCurrentUser && '(You)'}
                                    </p>
                                    <p className="font-mono text-xs font-black text-accent">{formatHours(entry.totalFocusMins)}h</p>
                                </div>
                                <div className="relative pt-1">
                                    <Progress value={(entry.totalFocusMins / maxMins) * 100} className="h-1.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {entries.length === 1 && (
                        <div className="p-12 text-center space-y-3">
                            <TrendingUp className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                            <p className="text-sm text-muted-foreground">The leaderboard is lonely! Invite friends to compare your progress.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
