'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';


const ADMIN_EMAIL = 'rovinduthamu@gmail.com';

interface AppUser {
    id: string;
    username: string;
    email: string;
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        if (!firestore) return;
        const usersCollection = collection(firestore, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => doc.data() as AppUser);
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users: ", error);
        toast({
            variant: "destructive",
            title: "Error fetching users",
            description: "Could not load user list.",
        })
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, isUserLoading, router, firestore, toast]);

  const handleDeleteUser = async (userIdToDelete: string) => {
    if (!firestore || !user || user.uid === userIdToDelete) {
        toast({
            variant: "destructive",
            title: "Action Forbidden",
            description: "You cannot delete your own account from the admin panel.",
        });
        return;
    }
    
    try {
        const userDocRef = doc(firestore, 'users', userIdToDelete);
        await deleteDoc(userDocRef);

        // Also delete subcollections if necessary, e.g., time_blocks
        // This is a more advanced operation and would require listing docs in subcollection first.
        // For now, we just delete the main user doc.

        setUsers(currentUsers => currentUsers.filter(u => u.id !== userIdToDelete));

        toast({
            title: "User Deleted",
            description: `User with ID ${userIdToDelete} has been successfully deleted.`,
        });
    } catch (error) {
        console.error("Error deleting user: ", error);
        toast({
            variant: "destructive",
            title: "Error Deleting User",
            description: "Could not delete the selected user.",
        });
    }
  };


  if (isUserLoading || isLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={0} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>Monitor and manage user data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}{u.id === user.uid && <Badge variant="secondary" className="ml-2">Admin</Badge>}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="font-mono">{u.id}</TableCell>
                    <TableCell className="text-right">
                        {u.id !== user.uid && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                        <Trash2 className="w-4 h-4" />
                                        <span className="sr-only">Delete User</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the user's
                                        account data from the database.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
