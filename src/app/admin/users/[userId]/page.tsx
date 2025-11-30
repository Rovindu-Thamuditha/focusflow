
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { UserStats } from '@/components/user-stats';

const ADMIN_EMAIL = 'rovindu2007@gmail.com';

interface AppUser {
    id: string;
    username: string;
    email: string;
}

export default function UserDetailPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  
  const { data: viewedUser, isLoading: isViewedUserLoading } = useDoc<AppUser>(userDocRef);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || isViewedUserLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading User Data...</div>
      </div>
    );
  }
  
  if (!viewedUser && !isLoading) {
    return (
       <div className="flex flex-col min-h-screen">
        <MainHeader totalFocusedTime={0} />
        <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>User Not Found</CardTitle>
                    <CardDescription>The user with ID "{userId}" does not exist.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link href="/admin" passHref>
                        <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin</Button>
                    </Link>
                </CardFooter>
            </Card>
        </main>
       </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={0} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="mb-4">
            <Link href="/admin" passHref>
                <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin Panel</Button>
            </Link>
        </div>
        <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>Viewing data for {viewedUser?.email}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold text-muted-foreground">Username</h3>
                    <p>{viewedUser?.username}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-muted-foreground">Email</h3>
                    <p>{viewedUser?.email}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-muted-foreground">User ID</h3>
                    <p className="font-mono text-sm">{viewedUser?.id}</p>
                </div>
                {/* Data editing UI will go here */}
            </CardContent>
            </Card>

            <UserStats userId={userId} />

        </div>
      </main>
    </div>
  );
}
