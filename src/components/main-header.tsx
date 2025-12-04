
import { LogOut, Shield, MoreVertical, BarChart2, Info, Newspaper, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dropdown-menu"
import { useUser, useAuth } from "@/firebase";
import { InfoDialog } from "./info-dialog";

const ADMIN_EMAIL = 'rovinduthamu@gmail.com';

interface MainHeaderProps {
  totalFocusedTime: number;
  children?: React.ReactNode;
}

export function MainHeader({ totalFocusedTime, children }: MainHeaderProps) {
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary">GridFocus</h1>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2">
          {/* Always visible on all screen sizes */}
          <TotalFocusTime totalHours={totalFocusedTime} />
          
          <div className="hidden sm:flex items-center space-x-1">
             {children}
          </div>

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
          <div className="hidden sm:flex items-center">
              {user && user.email === ADMIN_EMAIL && (
                <>
                    <Link href="/admin" passHref>
                        <Button variant="ghost" size="icon" title="Admin Panel">
                            <Shield className="h-5 w-5" />
                        </Button>
                    </Link>
                </>
              )}
              {isAnonymousUser ? (
                 <Link href="/login" passHref>
                    <Button>
                        <UserPlus className="mr-2" />
                        Sign up to Save
                    </Button>
                 </Link>
              ) : user ? (
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                  <LogOut className="h-5 w-5" />
                </Button>
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
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                   <InfoDialog />
                 </DropdownMenuItem>
                {user && user.email === ADMIN_EMAIL && (
                    <>
                        <DropdownMenuSeparator />
                        <Link href="/admin" passHref>
                            <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/whats-new" passHref>
                            <DropdownMenuItem>
                            <Newspaper className="mr-2 h-4 w-4" />
                            <span>What's New</span>
                            </DropdownMenuItem>
                        </Link>
                    </>
                )}
                <DropdownMenuSeparator />
                 {isAnonymousUser ? (
                    <Link href="/login" passHref>
                        <DropdownMenuItem>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Sign Up to Save</span>
                        </DropdownMenuItem>
                    </Link>
                 ) : user ? (
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
