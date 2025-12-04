
'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth, useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = 'FOCUS-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);

  const isAnonymousUser = currentUser?.isAnonymous;
  const pageTitle = isAnonymousUser ? "Save Your Progress" : (isSignUp ? "Create an Account" : "Welcome Back");
  const pageDescription = isAnonymousUser 
    ? "Create an account to permanently save your data."
    : (isSignUp ? 'Enter your details to get started.' : 'Sign in to access your dashboard.');

  const handleAuthAction = async () => {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Services not available",
        description: "Could not connect to authentication services.",
      });
      return;
    }
    setLoading(true);
    
    try {
      if (isSignUp) {
        if (!name) {
            toast({ variant: "destructive", title: "Name is required" });
            setLoading(false);
            return;
        }
        
        if (isAnonymousUser) {
          // Link anonymous account to new email/password account
          const credential = EmailAuthProvider.credential(email, password);
          const userCredential = await linkWithCredential(currentUser, credential);
          const user = userCredential.user;

          await updateProfile(user, { displayName: name });
          const userDocRef = doc(firestore, 'users', user.uid);
          const userData = {
            id: user.uid,
            username: name,
            email: user.email,
            inviteCode: generateInviteCode(),
            hasCompletedOnboarding: false,
          };
          
          await setDoc(userDocRef, userData, { merge: true });

        } else {
          // Regular sign-up
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          await updateProfile(user, { displayName: name });
          const userDocRef = doc(firestore, 'users', user.uid);
          const userData = {
            id: user.uid,
            username: name,
            email: user.email,
            inviteCode: generateInviteCode(),
            hasCompletedOnboarding: false,
          };

          setDoc(userDocRef, userData).catch(error => {
              errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({ path: userDocRef.path, operation: 'create', requestResourceData: userData })
              );
          });
          
          // Set default privacy settings
          const privacySettingsRef = doc(firestore, 'users', user.uid, 'privacy', 'settings');
          const privacyData = {
            id: 'settings',
            shareTotalFocusTime: false,
            participateInLeaderboards: false,
            shareSubjectBreakdown: false,
          }
          await setDoc(privacySettingsRef, privacyData);

        }
        toast({ title: "Account Secured!", description: "Your data is now saved." });
        router.push('/');

      } else {
        // Regular sign-in
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/');
      }
    } catch (error: any) {
      console.error(`Error ${isSignUp ? 'signing up' : 'signing in'}:`, error);
      
      let description = `Could not ${isSignUp ? 'sign up' : 'sign in'}. Please try again.`;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.code === 'auth/email-already-in-use') {
        description = "An account with this email already exists. Please sign in or use a different email.";
      } else if (error.code === 'auth/credential-already-in-use') {
        description = "This account is already linked to another user.";
      } else if (error.code === 'auth/weak-password') {
        description = "Password is too weak. It should be at least 6 characters long.";
      }

      toast({ variant: "destructive", title: "Authentication Failed", description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Icons.logo className="h-12 w-12 text-primary"/>
            </div>
          <CardTitle className="text-3xl font-bold">{pageTitle}</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {isSignUp && (
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                        id="name" 
                        type="text" 
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button onClick={handleAuthAction} className="w-full" disabled={loading}>
                {loading && <Icons.logo className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? (isAnonymousUser ? 'Link Account & Save' : 'Sign Up') : 'Sign In'}
            </Button>
            
            {!isAnonymousUser && (
              <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} disabled={loading}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            )}
             {isAnonymousUser && (
                <Button variant="link" onClick={() => router.push('/')} disabled={loading}>
                    Decide later
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
