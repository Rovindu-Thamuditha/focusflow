import { getAuth, signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { TotalFocusTime } from "@/components/total-focus-time";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase/auth/use-user";


interface MainHeaderProps {
  totalFocusedTime: number;
  children?: React.ReactNode;
}

export function MainHeader({ totalFocusedTime, children }: MainHeaderProps) {
  const { user } = useUser();
  const router = useRouter();
  const auth = getAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
          <Icons.logo className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">FocusFlow</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <TotalFocusTime totalHours={totalFocusedTime} />
          {children}
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
