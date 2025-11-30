import { LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { TotalFocusTime } from "@/components/total-focus-time";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@/firebase";
import { BarChart2 } from 'lucide-react';

const ADMIN_EMAIL = 'rovinduthamu@gmail.com';

interface MainHeaderProps {
  totalFocusedTime?: number;
  children?: React.ReactNode;
}

export function MainHeader({ totalFocusedTime = 0, children }: MainHeaderProps) {
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">FocusFlow</h1>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <TotalFocusTime totalHours={totalFocusedTime} />
          {children}
          {user && user.email === ADMIN_EMAIL && (
             <Link href="/admin" passHref>
               <Button variant="ghost" size="icon" title="Admin Panel">
                  <Shield className="h-5 w-5" />
               </Button>
            </Link>
          )}
          <Link href="/stats" passHref>
             <Button variant="ghost" size="icon" title="Statistics">
                <BarChart2 className="h-5 w-5" />
             </Button>
          </Link>
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
