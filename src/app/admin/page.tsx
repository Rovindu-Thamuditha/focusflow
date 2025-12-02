
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, KeyRound, Eye, Newspaper } from 'lucide-react';
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
    username?: string;
    email?: string;
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
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
        // Note: This only deletes the user document. The actual Firebase Auth user
        // would need to be deleted via a Cloud Function for a complete deletion.
        const userDocRef = doc(firestore, 'users', userIdToDelete);
        await deleteDoc(userDocRef);

        // This is a placeholder for actual user deletion from Firebase Auth
        // which should be handled by a backend function for security reasons.
        // For this client-side prototype, we'll just remove them from the list.
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userIdToDelete));

        toast({
            title: "User Deleted",
            description: `User with ID ${userIdToDelete} has been successfully deleted from Firestore.`,
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

  const handleResetPassword = async (email: string) => {
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Authentication service not available",
            description: "Please try again later.",
        });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "Password Reset Email Sent",
            description: `A password reset email has been sent to ${email}.`,
        });
    } catch (error: any) {
        console.error("Error sending password reset email: ", error);
        toast({
            variant: "destructive",
            title: "Failed to Send Email",
            description: error.message || "Could not send password reset email.",
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Admin Panel</CardTitle>
              <CardDescription>Monitor and manage user data.</CardDescription>
            </div>
            <Link href="/admin/whats-new" passHref>
              <Button variant="outline">
                <Newspaper className="mr-2 h-4 w-4" />
                Manage What's New
              </Button>
            </Link>
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
                {users.map((u, index) => (
                  <TableRow key={u.email || u.id || index}>
                    <TableCell className="font-medium">
                        {u.username || <span className="text-muted-foreground italic">(Anonymous User)</span>}
                        {u.id === user.uid && <Badge variant="secondary" className="ml-2">Admin</Badge>}
                    </TableCell>
                    <TableCell>{u.email || <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                    <TableCell className="font-mono">{u.id}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                        <Link href={`/admin/users/${u.id}`} passHref>
                            <Button variant="outline" size="icon" title="View/Edit User">
                            <Eye className="w-4 h-4" />
                            </Button>
                        </Link>
                        {u.id !== user.uid ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => handleResetPassword(u.email!)} 
                                    title="Send Password Reset"
                                    disabled={!u.email}
                                >
                                    <KeyRound className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" title="Delete User">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user's
                                            account data from the database. Note: The Auth user record is not deleted.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(u.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : null}
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
