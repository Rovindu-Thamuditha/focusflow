
'use client';

import { useState, useEffect } from 'react';
import { MainHeader } from '@/components/main-header';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, UserPlus, Send } from 'lucide-react';
import { FriendRequests } from '@/components/friends/friend-requests';
import { FriendsList } from '@/components/friends/friends-list';
import { GridFocusLoader } from '@/components/grid-focus-loader';

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
    const [friendCode, setFriendCode] = useState('');
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    
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
    
    const handleSendRequest = async () => {
        if (!firestore || !user || !friendCode.trim()) return;

        setIsSendingRequest(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('inviteCode', '==', friendCode.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: "destructive", title: "Invalid Code", description: "No user found with that invite code." });
                setIsSendingRequest(false);
                return;
            }

            const inviterDoc = querySnapshot.docs[0];
            const inviterId = inviterDoc.id;
            const inviterUsername = inviterDoc.data().username || 'the user';

            if (inviterId === user.uid) {
                toast({ variant: "destructive", title: "Oops!", description: "You can't add yourself as a friend." });
                setIsSendingRequest(false);
                return;
            }
            
            const friendshipsRef = collection(firestore, 'friendships');
            const sortedUserIds = [user.uid, inviterId].sort();
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

            const notificationRef = doc(collection(firestore, 'users', inviterId, 'notifications'));
            const notificationData = {
                type: 'friend_request',
                fromUserId: user.uid,
                title: 'New Friend Request',
                message: `${user.displayName || 'A new user'} sent you a friend request!`,
                isRead: false,
                createdAt: serverTimestamp(),
            };
            batch.set(notificationRef, notificationData);
    
            batch.commit()
                .then(() => {
                    toast({ title: 'Friend Request Sent!', description: `Your request to ${inviterUsername} has been sent.` });
                    setFriendCode('');
                })
                .catch((error) => {
                    console.error("Error sending friend request:", error);
                    errorEmitter.emit(
                        'permission-error',
                        new FirestorePermissionError({
                            path: `/users/${inviterId}/notifications`,
                            operation: 'create',
                            requestResourceData: notificationData
                        })
                    );
                })
                .finally(() => {
                     setIsSendingRequest(false);
                });

        } catch (error) {
            console.error("Error querying for friend request:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to check for existing friendships." });
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

                         <div className="p-4 border rounded-lg bg-secondary/50">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Send className="w-5 h-5"/>Enter a Friend's Code</h3>
                            <div className="flex items-center gap-2">
                                <Input 
                                    value={friendCode}
                                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                                    className="font-mono text-base" 
                                    placeholder="FOCUS-XXXX"
                                    disabled={isSendingRequest}
                                />
                                <Button onClick={handleSendRequest} disabled={!friendCode.trim() || isSendingRequest}>
                                    {isSendingRequest ? 'Sending...' : 'Add Friend'}
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
