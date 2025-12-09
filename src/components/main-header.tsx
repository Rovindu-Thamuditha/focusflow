
'use client';

import { LogOut, Shield, MoreVertical, BarChart2, Info, UserPlus, Users, User, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { TotalFocusTime } from "@/components/total-focus-time";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { InfoDialog } from "./info-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { doc } from "firebase/firestore";
import { useEffect, useState } from "react";

const CurrentTime = dynamic(() => import('./current-time').then(mod => mod.CurrentTime), { ssr: false });

const ADMIN_EMAIL = 'rovinduthamu@gmail.com';

interface MainHeaderProps {
  children?: React.ReactNode;
  totalFocusedTime: number;
  enableAiInsights?: boolean;
}

export function MainHeader({ children, totalFocusedTime, enableAiInsights }: MainHeaderProps) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    if(auth) {
      await auth.signOut();
      router.push('/login');
    }
  }

  const isAnonymousUser = user?.isAnonymous;
  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary">GridFocus</h1>
          </Link>
        </div>

        <div className="flex items-center justify-end flex-1 space-x-1 sm:space-x-2">
          { !isAnonymousUser && <TotalFocusTime totalHours={totalFocusedTime} /> }
          
          <div className="hidden sm:flex items-center">
             <CurrentTime />
          </div>
          
          {!isAnonymousUser && (
              <Link href="/friends" passHref>
                <Button variant="ghost" size="icon" title="Friends">
                    <Users className="h-5 w-5" />
                </Button>
              </Link>
          )}

          <Link href="/stats" passHref>
            <Button variant="ghost" size="icon" title="Statistics">
                <BarChart2 className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="hidden sm:inline-flex">
            <InfoDialog />
          </div>

          <ThemeToggle />

          {/* Desktop-only items */}
          <div className="hidden sm:flex items-center gap-1">
              {isAnonymousUser ? (
                 <Link href="/login" passHref>
                    <Button>
                        <UserPlus className="mr-2" />
                        Sign up to Save
                    </Button>
                 </Link>
              ) : user ? (
                <div className="flex items-center gap-2">
                {children}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                       <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <Link href="/profile" passHref>
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
                     {user.email === ADMIN_EMAIL && (
                        <Link href="/admin" passHref>
                            <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin</span>
                            </DropdownMenuItem>
                        </Link>
                     )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              ) : null}
          </div>
          
          {/* Mobile-only dropdown menu */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">{children}</div>
                <div className="px-2 py-1.5"><CurrentTime /></div>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                   <InfoDialog />
                 </DropdownMenuItem>
                 {!isAnonymousUser && (
                   <>
                    <Link href="/profile" passHref>
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/friends" passHref>
                      <DropdownMenuItem>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Friends</span>
                      </DropdownMenuItem>
                    </Link>
                    {enableAiInsights && (
                        <Link href="/insights" passHref>
                            <DropdownMenuItem>
                                <BrainCircuit className="mr-2 h-4 w-4" />
                                <span>AI Insights</span>
                            </DropdownMenuItem>
                        </Link>
                    )}
                   </>
                 )}
                <DropdownMenuSeparator />
                 {isAnonymousUser ? (
                    <Link href="/login" passHref>
                        <DropdownMenuItem>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Sign Up to Save</span>
                        </DropdownMenuItem>
                    </Link>                 ) : user ? (
                  <>
                  {user.email === ADMIN_EMAIL && (
                        <Link href="/admin" passHref>
                            <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin</span>
                            </DropdownMenuItem>
                        </Link>
                   )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
