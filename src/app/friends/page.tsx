
'use client';

import { useState, useEffect } from 'react';
import { MainHeader } from '@/components/main-header';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, UserPlus } from 'lucide-react';
import { FriendRequests } from '@/components/friends/friend-requests';
import { FriendsList } from '@/components/friends/friends-list';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { InviteCodeHandler } from '@/components/friends-ui/InviteCodeHandler';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AppUser {
    id: string;
    username?: string;
    email?: string;
    inviteCode?: string;
}

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = 'FOCUS-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
            
            try {
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data() as AppUser;
                    let code = userData.inviteCode;

                    if (!code) {
                        code = generateInviteCode();
                        await setDoc(userDocRef, { inviteCode: code }, { merge: true });
                    }
                    setInviteCode(code);
                } else {
                     console.error("User document not found for UID:", user.uid);
                     toast({
                        title: "Error",
                        description: "Could not load your user data. Please try logging in again.",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                 console.error("Error fetching user data:", error);
                 toast({
                    title: "Error",
                    description: "Could not retrieve user details. Please check your connection.",
                    variant: "destructive"
                });
            }
        };

        fetchUserData();
    }, [user, isUserLoading, firestore, router, toast]);

    const handleCopy = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        toast({ title: "Copied!", description: "Your invite code has been copied." });
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
            <MainHeader totalFocusedTime={0} showBackButton />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Add Friends</CardTitle>
                        <CardDescription>Share your invite code or enter a friend's code below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg bg-secondary/50">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><UserPlus className="w-5 h-5"/>Your Invite Code</h3>
                            <div className="flex items-center gap-2">
                                <Input value={inviteCode} readOnly className="font-mono text-base" placeholder="Generating..."/>
                                <Button onClick={handleCopy} size="icon" variant="outline" disabled={!inviteCode}>
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>

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
