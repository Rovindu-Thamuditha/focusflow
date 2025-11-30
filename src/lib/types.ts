import type { LucideIcon } from "lucide-react";

export interface TimeBlockState {
  hour: number;
  subject: string;
  duration: number; // in minutes
}

export interface Subject {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}
