
"use client"

import { cn } from "@/lib/utils";
import * as React from 'react';
import { Book, Zap, Coffee, Bed, Sparkles, BrainCircuit, FlaskConical, Dna, Code, PenTool, Briefcase } from "lucide-react";
import type { Subject } from "@/lib/types";

interface TimeBlockProps {
  hour: number;
  subjectId: string;
  duration: number;
  subjects: Subject[];
  onClick: (hour: number) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  isEditable: boolean;
}

const ICONS: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  BrainCircuit,
  FlaskConical,
  Dna,
  Code,
  PenTool,
  Book,
  Briefcase,
  Sparkles,
  Bed,
};

export function TimeBlock({ hour, subjectId, duration, subjects, onClick, onContextMenu, isEditable }: TimeBlockProps) {
  const subject = subjects.find(s => s.id === subjectId) || { id: 'idle', name: 'Idle', icon: 'Sparkles', color: 'hsl(var(--muted))' };

  const handleClick = () => {
    if (subject.id === 'sleep' || !isEditable) return;
    onClick(hour);
  };
  
  const formattedHour = (hour % 12 === 0 ? 12 : hour % 12) + (hour < 12 || hour === 24 ? ' AM' : ' PM');

  const getBrightness = () => {
    if (duration === 0) return 'brightness-50';
    if (duration < 60) return `brightness-${50 + Math.round((duration/60)*50)}`;
    return 'brightness-100';
  }

  const Icon = ICONS[subject.icon] || Sparkles;

  return (
    <button
      onClick={handleClick}
      onContextMenu={onContextMenu}
      className={cn(
        "relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all duration-300 ease-in-out transform",
        isEditable && "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
        "text-white",
        subject.id !== 'idle' && getBrightness(),
        (subject.id === 'sleep' || !isEditable) && 'cursor-not-allowed'
      )}
      style={{ 
        backgroundColor: subject.color,
        '--glow-color': subject.color 
      } as React.CSSProperties}
      aria-label={`Hour ${hour}:00, current state: ${subject.name}. Click to change.`}
      title={`${subject.name} - ${duration} mins`}
      disabled={!isEditable}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      <span className="text-[10px] sm:text-xs font-mono mt-1">{formattedHour}</span>
       {duration > 0 && subject.id !== 'idle' && subject.id !== 'sleep' && (
        <div 
            className={cn(
                "absolute inset-0 rounded-lg pointer-events-none",
            )}
            style={{boxShadow: `0 0 8px ${subject.color}, 0 0 16px ${subject.color}`}}
        />
      )}
    </button>
  );
}
