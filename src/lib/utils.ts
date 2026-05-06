import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string | null | undefined, fallback?: string | null) => {
    const text = name || fallback;
    if (text) {
      return text.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return '??';
}
