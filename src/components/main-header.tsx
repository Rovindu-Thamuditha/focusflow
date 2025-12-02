
import { LogOut, Shield, MoreVertical, BarChart2, Info, Newspaper } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary">GridFocus</h1>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden sm:flex items-center space-x-2">
              <TotalFocusTime totalHours={totalFocusedTime} />
              {children}
              {user && user.email === ADMIN_EMAIL && (
                <>
                    <Link href="/admin" passHref>
                        <Button variant="ghost" size="icon" title="Admin Panel">
                            <Shield className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/admin/whats-new" passHref>
                        <Button variant="ghost" size="icon" title="What's New Admin">
                            <Newspaper className="h-5 w-5" />
                        </Button>
                    </Link>
                </>
              )}
              <Link href="/stats" passHref>
                <Button variant="ghost" size="icon" title="Statistics">
                    <BarChart2 className="h-5 w-5" />
                </Button>
              </Link>
              <InfoDialog />
              <ThemeToggle />
              {user && (
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
          </div>
          <div className="sm:hidden flex items-center">
            <Link href="/stats" passHref>
              <Button variant="ghost" size="icon" title="Statistics">
                  <BarChart2 className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user && user.email === ADMIN_EMAIL && (
                    <>
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
                {/* This is a bit of a hack to get the settings and time in here */}
                <div className="flex flex-col items-start p-2 gap-2">
                    {children}
                </div>
                <div className="p-2">
                  <InfoDialog />
                </div>
                <DropdownMenuSeparator />
                 {user && (
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
