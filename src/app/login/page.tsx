'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const { auth, firestore } = initializeFirebase();

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name) {
            toast({
                variant: "destructive",
                title: "Name is required",
                description: "Please enter your name to sign up.",
            });
            setLoading(false);
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            displayName: name,
            email: user.email,
        }, { merge: true });

        toast({
          title: "Account Created",
          description: "You have successfully signed up. Please sign in.",
        });
        setIsSignUp(false);
        setName('');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/');
      }
    } catch (error: any) {
      console.error(`Error ${isSignUp ? 'signing up' : 'signing in'}:`, error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || `Could not ${isSignUp ? 'sign up' : 'sign in'}. Please try again.`,
      });
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
          <CardTitle className="text-3xl font-bold">{isSignUp ? 'Create an Account' : 'Welcome to FocusFlow'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Enter your details to get started.' : 'Sign in to track your focus and conquer your day.'}
          </CardDescription>
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
                {loading ? (
                    <Icons.logo className="mr-2 h-4 w-4 animate-spin"/>
                ) : null}
                {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} disabled={loading}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
