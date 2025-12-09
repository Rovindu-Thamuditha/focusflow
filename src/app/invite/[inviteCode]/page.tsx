
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
    const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'exists'>('idle');

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
            // Firestore doesn't support inequality checks on different fields in a single query.
            // We must perform two separate queries.
            const friendshipsRef = collection(firestore, 'friendships');
            
            // Query 1: Check for an accepted friendship.
            const acceptedQuery = query(
                friendshipsRef,
                where('userIds', 'array-contains', currentUser.uid),
                where('status', '==', 'accepted')
            );
            const acceptedSnapshot = await getDocs(acceptedQuery);
            const isAlreadyFriend = acceptedSnapshot.docs.some(doc => doc.data().userIds.includes(inviter.id));

            // Query 2: Check for a pending friendship.
            const pendingQuery = query(
                friendshipsRef,
                where('userIds', 'in', [[currentUser.uid, inviter.id], [inviter.id, currentUser.uid]]),
                where('status', '==', 'pending')
            );
            const pendingSnapshot = await getDocs(pendingQuery);

            if (isAlreadyFriend || !pendingSnapshot.empty) {
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

            await batch.commit();

            toast({ title: 'Friend Request Sent!', description: `Your request to ${inviter.username || 'the user'} has been sent.` });
            setRequestStatus('sent');

        } catch (error: any) {
            console.error("Error sending friend request:", error);
            setRequestStatus('error');
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({ 
                    path: `/users/${inviter.id}/notifications`, 
                    operation: 'create', 
                })
            );
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
                        {requestStatus === 'idle' && (
                             <Button className="w-full" size="lg" onClick={handleSendRequest} disabled={requestStatus === 'sending'}>
                                <UserPlus className="mr-2"/>
                                {requestStatus === 'sending' ? 'Sending...' : 'Send Friend Request'}
                            </Button>
                        )}
                         {requestStatus === 'sent' && (
                            <div className="text-center p-4 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg space-y-2">
                                <PartyPopper className="h-8 w-8 mx-auto"/>
                                <p className="font-semibold">Request Sent!</p>
                                <p className="text-sm">{inviter.username} will be notified.</p>
                            </div>
                        )}
                        {requestStatus === 'exists' && (
                             <div className="text-center p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-lg">
                                <p className="font-semibold">You already have a pending request with or are friends with {inviter.username}.</p>
                             </div>
                        )}
                        {requestStatus === 'error' && (
                            <div className="text-center p-4 bg-red-500/10 text-destructive rounded-lg">
                                <p className="font-semibold">Something went wrong. Please try again.</p>
                            </div>
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
