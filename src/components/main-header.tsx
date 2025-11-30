import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { TotalFocusTime } from "@/components/total-focus-time";

interface MainHeaderProps {
  totalFocusedTime: number;
}

export function MainHeader({ totalFocusedTime }: MainHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
          <Icons.logo className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">FocusFlow</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <TotalFocusTime totalHours={totalFocusedTime} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
