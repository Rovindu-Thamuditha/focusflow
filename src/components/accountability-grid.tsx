"use client"

import { useState } from 'react';
import { TimeBlock } from './time-block';
import { LogTimeDialog } from './log-time-dialog';
import type { TimeBlockState, Subject } from '@/lib/types';

interface AccountabilityGridProps {
  blocks: TimeBlockState[];
  subjects: Subject[];
  onBlockUpdate: (hour: number, subject: string, duration: number) => void;
}

export function AccountabilityGrid({ blocks, subjects, onBlockUpdate }: AccountabilityGridProps) {
  const [selectedBlock, setSelectedBlock] = useState<TimeBlockState | null>(null);

  const handleBlockClick = (hour: number) => {
    const block = blocks.find(b => b.hour === hour);
    if (block) {
      setSelectedBlock(block);
    }
  };

  const handleDialogSave = (subject: string, duration: number) => {
    if (selectedBlock) {
      onBlockUpdate(selectedBlock.hour, subject, duration);
      setSelectedBlock(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-primary">12-Hour Focus Grid (8 AM - 8 PM)</h2>
      <div className="grid grid-cols-6 gap-2">
        {blocks.map(block => (
          <TimeBlock
            key={block.hour}
            hour={block.hour}
            subjectId={block.subject}
            duration={block.duration}
            subjects={subjects}
            onClick={handleBlockClick}
          />
        ))}
      </div>
      {selectedBlock && (
        <LogTimeDialog
          block={selectedBlock}
          subjects={subjects}
          onSave={handleDialogSave}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}
