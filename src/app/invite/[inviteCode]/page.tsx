
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, getDoc } from 'firebase/firestore';
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
            const qAccepted = query(friendshipsRef, where('userIds', 'in', [[currentUser.uid, inviter.id].sort()]), where('status', '==', 'accepted'));
            const qPending = query(friendshipsRef, where('userIds', 'in', [[currentUser.uid, inviter.id].sort()]), where('status', '==', 'pending'));
    
            const [acceptedSnapshot, pendingSnapshot] = await Promise.all([getDocs(qAccepted), getDocs(qPending)]);
    
            if (!acceptedSnapshot.empty || !pendingSnapshot.empty) {
                setRequestStatus('exists');
                return;
            }
    
            // Create a new friendship document and a notification for the target user
            const batch = writeBatch(firestore);
    
            // Friendship Doc
            const newFriendshipRef = doc(collection(firestore, 'friendships'));
            const friendshipData = {
                userIds: [currentUser.uid, inviter.id].sort(),
                status: 'pending',
                requesterId: currentUser.uid,
                createdAt: serverTimestamp()
            };
            batch.set(newFriendshipRef, friendshipData);
    
            // Notification Doc for the inviter
            const notificationRef = doc(collection(firestore, 'users', inviter.id, 'notifications'));
            const notificationData = {
                userId: inviter.id,
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
                        {/* This button should only show in the 'idle' or 'error' state, 
                            and be disabled only while 'sending'. 
                            However, if the status is 'sending', it should still display the loading state.
                            Let's group the clickable/loading states together.
                        */}
                        {requestStatus === 'idle' || requestStatus === 'error' || requestStatus === 'sending' ? (
                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleSendRequest} 
                                // The button should be disabled when it is 'sending'
                                disabled={requestStatus === 'sending'} 
                                // The button should only be clickable if it's 'idle' or 'error'
                                // We can add a check here, but the 'disabled' prop handles the primary control.
                            >
                                <UserPlus className="mr-2"/>
                                {requestStatus === 'sending' ? 'Sending...' : 'Send Friend Request'}
                            </Button>
                        ) : null}
                        
                        {/* The rest of your status checks remain the same */}
                        {requestStatus === 'sent' && (
                            {/* ... */}
                        )}
                        {requestStatus === 'exists' && (
                            {/* ... */}
                        )}
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
