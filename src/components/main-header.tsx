
import { LogOut, Shield, MoreVertical, BarChart2, Info, Newspaper, UserPlus, ToyBrick, Settings } from "lucide-react";
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
import { Badge } from "./ui/badge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface MainHeaderProps {
  totalFocusedTime: number;
  children?: React.ReactNode;
  isFlipped?: boolean;
  onFlipClick?: () => void;
  isAnimating?: boolean;
  settingsContent?: React.ReactNode;
}

const ADMIN_EMAIL = 'rovinduthamu@gmail.com';

export function MainHeader({ totalFocusedTime, children, isFlipped, onFlipClick, isAnimating, settingsContent }: MainHeaderProps) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    if(auth) {
      await auth.signOut();
      router.push('/login');
    }
  }

  const isAnonymousUser = user?.isAnonymous;

  return (
    <header className={cn(
        "z-40 w-full border-b bg-background/95 backdrop-blur-sm",
        theme === 'stranger-things' ? 'relative' : 'sticky top-0'
      )}>
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary [.stranger-things_&]:text-glow">GridFocus</h1>
          </Link>
        </div>

        {/* Desktop View */}
        <div className="hidden flex-1 items-center justify-end space-x-2 sm:flex">
          <TotalFocusTime totalHours={totalFocusedTime} />
          {user && user.email === ADMIN_EMAIL && (
            <>
                <Link href="/admin" passHref>
                    <Button variant="ghost" size="icon" title="Admin Panel">
                        <Shield className="h-5 w-5 text-foreground" />
                    </Button>
                </Link>
                <Link href="/admin/whats-new" passHref>
                    <Button variant="ghost" size="icon" title="What's New Admin">
                        <Newspaper className="h-5 w-5 text-foreground" />
                    </Button>
                </Link>
            </>
          )}
          <Link href="/stats" passHref>
            <Button variant="ghost" size="icon" title="Statistics">
                <BarChart2 className="h-5 w-5 text-foreground" />
            </Button>
          </Link>
          <InfoDialog />
          {settingsContent}
          {theme === 'stranger-things' && (
             <Button variant="ghost" size="icon" onClick={onFlipClick} disabled={isAnimating} title="Restore Reality">
                <ToyBrick className="h-5 w-5 text-foreground"/>
            </Button>
          )}
          <div className="relative">
            <ThemeToggle />
            <Badge className="absolute -top-1 -right-2 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 pointer-events-none animate-pulse">New!</Badge>
          </div>
          {isAnonymousUser ? (
              <Link href="/login" passHref>
                <Button>
                    <UserPlus className="mr-2" />
                    Sign up to Save
                </Button>
              </Link>
          ) : user ? (
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-5 w-5 text-foreground" />
            </Button>
          ) : null}
        </div>
        
        {/* Mobile View */}
        <div className="sm:hidden flex flex-1 items-center justify-end space-x-1">
          <TotalFocusTime totalHours={totalFocusedTime} />
          
          <Link href="/stats" passHref>
            <Button variant="ghost" size="icon" title="Statistics">
                <BarChart2 className="h-5 w-5 text-foreground" />
            </Button>
          </Link>

          {settingsContent}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAnonymousUser ? (
                <Link href="/login" passHref>
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Sign Up to Save</span>
                    </DropdownMenuItem>
                </Link>
              ) : null}

              {theme === 'stranger-things' && (
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onFlipClick?.(); }}>
                    <ToyBrick className="mr-2 h-4 w-4"/>
                    <span>Restore Reality</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="p-0 flex items-center w-full">
                    {children}
                  </div>
              </DropdownMenuItem>
              
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
              
               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="p-0 flex items-center">
                    <InfoDialog />
                    <span className="ml-2">How to Use</span>
                  </div>
              </DropdownMenuItem>

               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="p-0 flex items-center w-full">
                    <span className="mr-2">Theme</span>
                    <div className="ml-auto">
                      <ThemeToggle />
                    </div>
                  </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />

              {user && !isAnonymousUser && (
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
