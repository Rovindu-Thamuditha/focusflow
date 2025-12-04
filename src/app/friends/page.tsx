
'use client';

import { useState, useEffect } from 'react';
import { MainHeader } from '@/components/main-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, UserPlus, Send, X, CheckCircle, Clock } from 'lucide-react';
import { AddFriendForm } from '@/components/friends/add-friend-form';
import { FriendRequests } from '@/components/friends/friend-requests';
import { FriendsList } from '@/components/friends/friends-list';

interface AppUser {
    id: string;
    username?: string;
    email?: string;
    inviteCode?: string;
}

export default function FriendsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);
    
    useEffect(() => {
        if (isUserLoading) return;
        if (!user || user.isAnonymous) {
            router.push('/login');
            return;
        }

        const fetchUserData = async () => {
            if (!firestore || !user) return;
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data() as AppUser;
                if (userData.inviteCode) {
                    setInviteCode(userData.inviteCode);
                } else {
                    // This should have been created on sign-up, but as a fallback:
                    const newInviteCode = `FOCUS-${user.uid.substring(0, 6).toUpperCase()}`;
                    setInviteCode(newInviteCode);
                    // Consider writing this back to the user doc.
                }
            }
        };

        fetchUserData();
    }, [user, isUserLoading, firestore, router]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading Friends...</div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader totalFocusedTime={0} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Your Connections</CardTitle>
                        <CardDescription>Share your code to add friends and build your accountability circle.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg bg-secondary/50">
                            <h3 className="font-semibold mb-2">Your Invite Code</h3>
                            <div className="flex items-center gap-2">
                                <Input value={inviteCode} readOnly className="font-mono text-lg" />
                                <Button onClick={handleCopy} size="icon" variant="outline">
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>

                        <AddFriendForm currentUser={user} />
                        
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
