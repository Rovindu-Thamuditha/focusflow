'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { User as FirebaseUser } from 'firebase/auth';

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
        // You might want to show a toast message here
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, isUserLoading, router, firestore]);

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}{u.id === user.uid && <Badge variant="secondary" className="ml-2">Admin</Badge>}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="font-mono">{u.id}</TableCell>
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
