
"use client"

import * as React from "react"
import { Moon, Sun, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const handleThemeChange = (newTheme: string) => {
    if (theme === 'stranger-things' && newTheme !== 'stranger-things') {
      setTheme(newTheme);
      // Force a reload to ensure all styles are correctly applied
      window.location.reload();
    } else {
      setTheme(newTheme);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 [.stranger-things_&]:hidden" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 [.stranger-things_&]:hidden" />
          <Sparkles className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all text-primary hidden [.stranger-things_&]:block [.stranger-things_&]:rotate-0 [.stranger-things_&]:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("stranger-things")}>
          Stranger Themes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
