
'use client';

import { useState, useEffect } from 'react';
import { MainHeader } from '@/components/main-header';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { FriendRequests } from '@/components/friends/friend-requests';
import { FriendsList } from '@/components/friends/friends-list';
import { GridFocusLoader } from '@/components/grid-focus-loader';


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
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    
    useEffect(() => {
        if (isUserLoading) return;
        if (!user || user.isAnonymous) {
            toast({
                title: "Login Required",
                description: "You must have an account to add friends.",
                variant: "destructive"
            });
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
                    // Construct the full URL for the invite link
                    const origin = window.location.origin;
                    setInviteLink(`${origin}/invite/${userData.inviteCode}`);
                }
            }
        };

        fetchUserData();
    }, [user, isUserLoading, firestore, router, toast]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast({ title: "Copied!", description: "Your invite link has been copied to the clipboard." });
        setTimeout(() => setCopied(false), 2000);
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
            <MainHeader totalFocusedTime={0} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Invite Your Friends</CardTitle>
                        <CardDescription>Share your unique link to add friends and build your accountability circle.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg bg-secondary/50">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><LinkIcon className="w-5 h-5"/>Your Invite Link</h3>
                            <div className="flex items-center gap-2">
                                <Input value={inviteLink} readOnly className="font-mono text-base" />
                                <Button onClick={handleCopy} size="icon" variant="outline" disabled={!inviteLink}>
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
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
