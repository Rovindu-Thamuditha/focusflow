
'use client';

import { LogOut, Shield, BarChart2, UserPlus, Users, User, Settings, ArrowLeft } from "lucide-react";
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
import { useUser, useAuth } from "@/firebase";
import { InfoDialog } from "./info-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/lib/utils";

const CurrentTime = dynamic(() => import('./current-time').then(mod => mod.CurrentTime), { ssr: false });
const ADMIN_EMAIL = 'rovinduthamu@gmail.com';

interface MainHeaderProps {
  totalFocusedTime: number;
  showBackButton?: boolean;
}

export function MainHeader({ totalFocusedTime, showBackButton = false }: MainHeaderProps) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    if(auth) {
      await auth.signOut();
      router.push('/login');
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container px-6 flex h-16 items-center justify-between">
        <div className="flex gap-4 items-center">
            {showBackButton ? (
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                 </Button>
            ) : (
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Icons.logo className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter text-foreground hidden sm:inline-block">GridFocus</h1>
                </Link>
            )}
        </div>

        <div className="flex items-center gap-3">
          { !user?.isAnonymous && <TotalFocusTime totalHours={totalFocusedTime} /> }
          
          <div className="hidden md:flex items-center gap-1">
             <CurrentTime />
             <div className="w-px h-4 bg-border mx-2" />
             {!user?.isAnonymous && (
                <Link href="/friends">
                  <Button variant="ghost" size="icon" title="Friends"><Users className="w-5 h-5" /></Button>
                </Link>
            )}
            <Link href="/stats">
              <Button variant="ghost" size="icon" title="Stats"><BarChart2 className="w-5 h-5" /></Button>
            </Link>
            <InfoDialog />
          </div>

          <ThemeToggle />

          {user?.isAnonymous ? (
            <Link href="/login">
              <Button size="sm" className="font-bold rounded-full">Sign Up</Button>
            </Link>
          ) : user ? (
            <div className="flex items-center gap-1">
              <Link href="/settings">
                <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full ring-2 ring-primary/20 p-0 overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="text-[10px]">{getInitials(user.displayName, user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-bold truncate">{user.displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile"><DropdownMenuItem><User className="mr-2 w-4 h-4" />Profile</DropdownMenuItem></Link>
                  {user.email === ADMIN_EMAIL && <Link href="/admin"><DropdownMenuItem><Shield className="mr-2 w-4 h-4" />Admin</DropdownMenuItem></Link>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive"><LogOut className="mr-2 w-4 h-4" />Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
