import type { Subject } from './types';

export const defaultSubjects: Subject[] = [
  { id: 'math', name: 'Combined Maths', icon: 'BrainCircuit', color: '#f97316' },
  { id: 'physics', name: 'Physics', icon: 'FlaskConical', color: '#3b82f6' },
  { id: 'chemistry', name: 'Chemistry', icon: 'FlaskConical', color: '#8b5cf6' },
  { id: 'biology', name: 'Biology', icon: 'Dna', color: '#10b981' },
  { id: 'coding', name: 'Coding', icon: 'Code', color: '#0ea5e9' },
  { id: 'reading', name: 'Reading', icon: 'Book', color: '#ef4444' },
  { id: 'work', name: 'Work', icon: 'Briefcase', color: '#6366f1' },
  { id: 'idle', name: 'Idle', icon: 'Sparkles', color: 'hsl(var(--muted))' },
  { id: 'sleep', name: 'Sleep', icon: 'Bed', color: 'hsl(240 5.9% 10%)' },
];
