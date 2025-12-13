
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { UserPlus, ArrowLeft, PartyPopper } from 'lucide-react';
import Link from 'next/link';

interface Inviter {
    id: string;
    username: string;
    photoURL?: string;
}

// Define the clear union type for request status
type RequestStatus = 'idle' | 'sending' | 'sent' | 'error' | 'exists';

export default function InvitePage() {
    const { user: currentUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const inviteCode = params.inviteCode as string;

    const [inviter, setInviter] = useState<Inviter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');

    useEffect(() => {
        const findInviter = async () => {
            if (!firestore || !inviteCode) return;

            try {
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where('inviteCode', '==', inviteCode));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setError('This invite link is invalid or has expired.');
                } else {
                    const inviterDoc = querySnapshot.docs[0];
                    if (currentUser && inviterDoc.id === currentUser.uid) {
                        setError("You can't use your own invite link!");
                    } else {
                        setInviter({ id: inviterDoc.id, ...inviterDoc.data() } as Inviter);
                    }
                }
            } catch (err) {
                console.error("Error finding inviter:", err);
                setError('Could not process this invite link.');
            } finally {
                setIsLoading(false);
            }
        };

        findInviter();
    }, [firestore, inviteCode, currentUser]);

    const handleSendRequest = async () => {
        if (!firestore || !currentUser || currentUser.isAnonymous || !inviter) return;
    
        setRequestStatus('sending');
        try {
            const friendshipsRef = collection(firestore, 'friendships');
            
            // Check for existing accepted or pending relationships
            const sortedUserIds = [currentUser.uid, inviter.id].sort();
            const qExisting = query(friendshipsRef, where('userIds', '==', sortedUserIds));
            
            const existingSnapshot = await getDocs(qExisting);
    
            if (!existingSnapshot.empty) {
                setRequestStatus('exists');
                return;
            }
    
            // Create a new friendship document and a notification for the target user
            const batch = writeBatch(firestore);
    
            // Friendship Doc
            const newFriendshipRef = doc(collection(firestore, 'friendships'));
            const friendshipData = {
                userIds: sortedUserIds,
                status: 'pending',
                requesterId: currentUser.uid,
                createdAt: serverTimestamp()
            };
            batch.set(newFriendshipRef, friendshipData);
    
            // Notification Doc for the inviter
            const notificationRef = doc(collection(firestore, 'users', inviter.id, 'notifications'));
            const notificationData = {
                type: 'friend_request',
                fromUserId: currentUser.uid,
                title: 'New Friend Request',
                message: `${currentUser.displayName || 'A new user'} accepted your invite!`,
                isRead: false,
                createdAt: serverTimestamp(),
            };
            batch.set(notificationRef, notificationData);
    
            batch.commit()
                .then(() => {
                    toast({ title: 'Friend Request Sent!', description: `Your request to ${inviter.username || 'the user'} has been sent.` });
                    setRequestStatus('sent');
                })
                .catch(err => {
                     console.error("Error writing friend request batch:", err);
                     setRequestStatus('error');
                     errorEmitter.emit(
                         'permission-error',
                         new FirestorePermissionError({
                             path: `/users/${inviter.id}/notifications`,
                             operation: 'create',
                             requestResourceData: notificationData
                         })
                     );
                });
    
        } catch (error: any) {
            console.error("Error sending friend request:", error);
            setRequestStatus('error');
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
        }
    };

    // --- NEW HELPER FUNCTION FOR CLEANER JSX RENDERING ---
    const renderInviteAction = () => {
        if (!inviter) return null; // Should not happen if renderContent is called correctly

        switch (requestStatus) {
            case 'idle':
            case 'error':
            case 'sending':
                // Button is rendered in all three states, and disabled only while 'sending'.
                return (
                    <Button 
                        className="w-full" 
                        size="lg" 
                        onClick={handleSendRequest} 
                        disabled={requestStatus === 'sending'}
                    >
                        <UserPlus className="mr-2"/>
                        {requestStatus === 'sending' ? 'Sending...' : 'Send Friend Request'}
                    </Button>
                );

            case 'sent':
                return (
                    <div className="text-center p-4 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg space-y-2">
                        <PartyPopper className="h-8 w-8 mx-auto"/>
                        <p className="font-semibold">Request Sent!</p>
                        <p className="text-sm">{inviter.username} will be notified.</p>
                    </div>
                );

            case 'exists':
                return (
                    <div className="text-center p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-lg">
                        <p className="font-semibold">You already have a pending request with or are friends with {inviter.username}.</p>
                    </div>
                );
                
            default:
                return null;
        }
    }
    // -----------------------------------------------------

    const renderContent = () => {
        if (isLoading || isUserLoading) {
            return <GridFocusLoader />;
        }

        if (error) {
            return <p className="text-destructive text-center">{error}</p>;
        }

        if (!currentUser || currentUser.isAnonymous) {
            return (
                <div className="text-center space-y-4">
                    <p>You need to be logged in to accept an invite.</p>
                    <Link href="/login" passHref><Button>Login or Sign Up</Button></Link>
                </div>
            );
        }

        if (inviter) {
            return (
                <>
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={inviter.photoURL} alt={inviter.username} />
                            <AvatarFallback className="text-4xl">{getInitials(inviter.username)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">{inviter.username}</CardTitle>
                        <CardDescription>has invited you to connect on GridFocus!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Use the new helper function for clean, type-safe rendering */}
                        {renderInviteAction()}
                    </CardContent>
                </>
            );
        }

        return <p className="text-muted-foreground text-center">Could not find the user for this invite.</p>;
    };

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader totalFocusedTime={0} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    {renderContent()}
                    <CardFooter className="justify-center pt-4">
                        <Link href="/" passHref>
                           <Button variant="ghost"><ArrowLeft className="mr-2"/> Go Back Home</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
