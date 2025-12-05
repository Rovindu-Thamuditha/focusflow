import type { Subject } from './types';

export const defaultSubjects: Subject[] = [
  { id: 'math', name: 'Mathematics', icon: 'BrainCircuit', color: '#8b5cf6' },
  { id: 'physics', name: 'Physics', icon: 'FlaskConical', color: '#ef4444' },
  { id: 'chemistry', name: 'Chemistry', icon: 'FlaskConical', color: '#3b82f6' },
  { id: 'biology', name: 'Biology', icon: 'Dna', color: '#10b981' },
  { id: 'idle', name: 'Idle', icon: 'Sparkles', color: 'hsl(var(--muted))' },
  // sleep is handled separately in TimeBlock component
];
