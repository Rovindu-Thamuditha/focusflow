
'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth, useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { TimeBlockState } from '@/lib/types';

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
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAnonymousUser = currentUser?.isAnonymous;
  
  const showToggle = true;

  const getPageContent = () => {
    if (isAnonymousUser) {
      if (isSignUp) {
         return {
            title: "Create Account to Save",
            description: "Create an account to permanently save your progress.",
            buttonText: "Create Account & Save",
            isSignUpFlow: true,
        };
      }
      return {
        title: "Sign In to Save",
        description: "Sign in to an existing account to sync your progress.",
        buttonText: "Sign In & Save",
        isSignUpFlow: false,
      };
    }
    if (isSignUp) {
      return {
        title: "Create an Account",
        description: "Enter your details to get started.",
        buttonText: "Sign Up",
        isSignUpFlow: true,
      };
    }
    return {
      title: "Welcome Back",
      description: "Sign in to access your dashboard.",
      buttonText: "Sign In",
      isSignUpFlow: false,
    };
  };

  const { title, description, buttonText, isSignUpFlow } = getPageContent();
  
  const migrateLocalDataToFirebase = async (userId: string) => {
    if (!firestore) return;
  
    try {
      const batch = writeBatch(firestore);
  
      const settingsStr = localStorage.getItem('gridFocusSettings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        const userDocRef = doc(firestore, 'users', userId);
        batch.set(userDocRef, { settings }, { merge: true });
      }
  
      const timeBlocksStr = localStorage.getItem('gridFocusTimeBlocks');
      if (timeBlocksStr) {
        const localTimeBlocks: { [date: string]: TimeBlockState[] } = JSON.parse(timeBlocksStr);
        Object.entries(localTimeBlocks).forEach(([date, blocks]) => {
          blocks.forEach(block => {
            const blockDocRef = doc(firestore, 'users', userId, 'time_blocks', `${date}_${block.hour}`);
            batch.set(blockDocRef, block);
          });
        });
      }
  
      const todosStr = localStorage.getItem('gridFocusTodos');
      if (todosStr) {
        const localTodos = JSON.parse(todosStr);
        localTodos.forEach((todo: any) => {
          const todoDocRef = doc(collection(firestore, 'users', userId, 'todos'));
          const { id, ...todoData } = todo; 
          batch.set(todoDocRef, todoData);
        });
      }
  
      await batch.commit();
  
      localStorage.removeItem('gridFocusTimeBlocks');
      localStorage.removeItem('gridFocusSettings');
      localStorage.removeItem('gridFocusTodos');
      localStorage.removeItem('gridFocusSolvedChallenges');
  
      toast({ title: "Data Synced!", description: "Your local progress has been saved to your account." });
  
    } catch (error) {
      console.error("Error migrating local data: ", error);
      toast({
        variant: "destructive",
        title: "Data Sync Failed",
        description: "Could not save your local progress to your new account. Your data is still safe on this device.",
      });
    }
  };


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
      if (isSignUpFlow) { // This covers both new sign-ups and anonymous linking
        if (!name) {
            toast({ variant: "destructive", title: "Name is required" });
            setLoading(false);
            return;
        }
        
        let user;

        if (isAnonymousUser) {
          const credential = EmailAuthProvider.credential(email, password);
          const userCredential = await linkWithCredential(currentUser, credential);
          user = userCredential.user;

          await updateProfile(user, { displayName: name });
          const userDocRef = doc(firestore, 'users', user.uid);
          const userData = {
            username: name,
            email: user.email,
          };
          
          await setDoc(userDocRef, userData, { merge: true });
          await migrateLocalDataToFirebase(user.uid);

        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
          
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
              throw error;
          });
          
          await migrateLocalDataToFirebase(user.uid);
          
          const privacySettingsRef = doc(firestore, 'users', user.uid, 'privacy', 'settings');
          const privacyData = {
            id: 'settings',
            shareTotalFocusTime: false,
            participateInLeaderboards: false,
            shareSubjectBreakdown: false,
          }
          await setDoc(privacySettingsRef, privacyData);
        }
        toast({ title: "Account Created!", description: "Welcome to GridFocus!" });
        router.push('/');

      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (isAnonymousUser) {
            await migrateLocalDataToFirebase(userCredential.user.uid);
        }
        router.push('/');
      }
    } catch (error: any) {
      console.error(`Error during authentication:`, error);
      
      if(error.name === 'FirebaseError' && error.message.includes('denied')){
        setLoading(false);
        return;
      }

      let description = `Could not ${isSignUpFlow ? 'sign up' : 'sign in'}. Please try again.`;
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
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {isSignUpFlow && (
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                        id="name" 
                        type="text" 
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
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
                    required
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
                    required
                />
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button onClick={handleAuthAction} className="w-full" disabled={loading}>
                {loading && <Icons.logo className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText}
            </Button>
            
            {showToggle && (
              <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} disabled={loading}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
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
