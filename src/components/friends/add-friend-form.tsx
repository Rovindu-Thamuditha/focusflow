
'use client';

import { useState } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface AddFriendFormProps {
    currentUser: FirebaseUser;
}

export function AddFriendForm({ currentUser }: AddFriendFormProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !inviteCode.trim() || !currentUser) return;

        setIsLoading(true);
        try {
            // 1. Find user with the given invite code
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('inviteCode', '==', inviteCode.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'User Not Found', description: 'No user found with that invite code.' });
                setIsLoading(false);
                return;
            }

            const targetUserDoc = querySnapshot.docs[0];
            const targetUserId = targetUserDoc.id;
            const targetUserData = targetUserDoc.data();

            if (targetUserId === currentUser.uid) {
                toast({ variant: 'destructive', title: 'Cannot Add Yourself', description: 'You cannot send a friend request to yourself.' });
                setIsLoading(false);
                return;
            }

            // 2. Check if a friendship or pending request already exists
            const friendshipsRef = collection(firestore, 'friendships');
            const existingFriendshipQuery = query(
                friendshipsRef,
                where('userIds', 'in', [[currentUser.uid, targetUserId], [targetUserId, currentUser.uid]])
            );
            
            const existingFriendshipSnapshot = await getDocs(existingFriendshipQuery);

            if (!existingFriendshipSnapshot.empty) {
                toast({ variant: 'destructive', title: 'Request Already Exists', description: 'You already have a pending request with this user or are already friends.' });
                setIsLoading(false);
                return;
            }
            
            // 3. Create a new friendship document and a notification for the target user
            const batch = writeBatch(firestore);

            const newFriendshipRef = doc(collection(firestore, 'friendships'));
            const friendshipData = {
                userIds: [currentUser.uid, targetUserId],
                status: 'pending',
                requesterId: currentUser.uid,
                createdAt: serverTimestamp()
            };
            batch.set(newFriendshipRef, friendshipData);

            // Create notification for the recipient
            const notificationRef = doc(collection(firestore, 'users', targetUserId, 'notifications'));
            const notificationData = {
                type: 'friend_request',
                fromUserId: currentUser.uid,
                title: 'New Friend Request',
                message: `${currentUser.displayName || 'A new user'} wants to be your friend!`,
                isRead: false,
                createdAt: serverTimestamp(),
            };
            batch.set(notificationRef, notificationData);

            await batch.commit().catch(error => {
                // This is a batch write, so it's hard to know which `set` failed.
                // We will report on the potential friendship creation.
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({ 
                        path: newFriendshipRef.path, 
                        operation: 'create', 
                        requestResourceData: friendshipData 
                    })
                );
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({ 
                        path: notificationRef.path, 
                        operation: 'create', 
                        requestResourceData: notificationData 
                    })
                );
                // Re-throw to be caught by outer catch
                throw error;
            });


            toast({ title: 'Friend Request Sent!', description: `Your request to ${targetUserData.username || 'the user'} has been sent.` });
            setInviteCode('');

        } catch (error) {
            console.error("Error sending friend request:", error);
            // The contextual error is already emitted, so we can show a generic toast here
            // or do nothing if the global error handler is sufficient.
            if (!(error instanceof FirestorePermissionError)) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not send friend request. Please try again.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSendRequest} className="space-y-4">
             <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Add a Friend</h3>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Enter an invite code (e.g. FOCUS-4B8T)"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !inviteCode.trim()}>
                        <Send className="w-5 h-5 mr-2" />
                        {isLoading ? 'Sending...' : 'Send Request'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
