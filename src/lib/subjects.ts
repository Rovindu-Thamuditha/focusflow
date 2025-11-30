import { Book, Code, PenTool, BrainCircuit, FlaskConical, Briefcase, Sparkles, Bed } from 'lucide-react';

export const subjects = [
  { id: 'math', name: 'Maths', icon: BrainCircuit, color: 'hsl(var(--chart-1))' },
  { id: 'physics', name: 'Physics', icon: FlaskConical, color: 'hsl(var(--chart-2))' },
  { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, color: 'hsl(var(--chart-3))' },
  { id: 'coding', name: 'Coding', icon: Code, color: 'hsl(var(--chart-4))' },
  { id: 'writing', name: 'Writing', icon: PenTool, color: 'hsl(var(--chart-5))' },
  { id: 'reading', name: 'Reading', icon: Book, color: 'hsl(var(--primary))' },
  { id: 'work', name: 'Work', icon: Briefcase, color: 'hsl(var(--accent))' },
  { id: 'idle', name: 'Idle', icon: Sparkles, color: 'hsl(var(--muted))' },
  { id: 'sleep', name: 'Sleep', icon: Bed, color: 'hsl(240 5.9% 10%)' },
];
