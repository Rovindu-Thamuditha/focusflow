'use client';

import { useState } from 'react';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

export function InviteCodeHandler() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [friendCode, setFriendCode] = useState('');
    const [isSendingRequest, setIsSendingRequest] = useState(false);

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

    return (
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
    )
}
