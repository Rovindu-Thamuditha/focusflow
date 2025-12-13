
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
    const [friendUsername, setFriendUsername] = useState('');
    const [isSendingRequest, setIsSendingRequest] = useState(false);

    const handleSendRequest = async () => {
        if (!firestore || !user || !friendUsername.trim()) return;

        setIsSendingRequest(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('username', '==', friendUsername.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: "destructive", title: "User Not Found", description: "No user found with that username." });
                setIsSendingRequest(false);
                return;
            }

            const friendDoc = querySnapshot.docs[0];
            const friendId = friendDoc.id;
            const friendData = friendDoc.data();

            if (friendId === user.uid) {
                toast({ variant: "destructive", title: "Oops!", description: "You can't add yourself as a friend." });
                setIsSendingRequest(false);
                return;
            }
            
            const friendshipsRef = collection(firestore, 'friendships');
            const sortedUserIds = [user.uid, friendId].sort();
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

            const notificationRef = doc(collection(firestore, 'users', friendId, 'notifications'));
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
                    toast({ title: 'Friend Request Sent!', description: `Your request to ${friendData.username} has been sent.` });
                    setFriendUsername('');
                })
                .catch((error) => {
                    console.error("Error sending friend request:", error);
                    errorEmitter.emit(
                        'permission-error',
                        new FirestorePermissionError({
                            path: `/users/${friendId}/notifications`,
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
            toast({ variant: "destructive", title: "Error", description: "Failed to send friend request." });
            setIsSendingRequest(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-secondary/50">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Send className="w-5 h-5"/>Enter a Friend's Username</h3>
            <div className="flex items-center gap-2">
                <Input 
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    className="text-base" 
                    placeholder="Username"
                    disabled={isSendingRequest}
                />
                <Button onClick={handleSendRequest} disabled={!friendUsername.trim() || isSendingRequest}>
                    {isSendingRequest ? 'Sending...' : 'Add Friend'}
                </Button>
            </div>
        </div>
    )
}
