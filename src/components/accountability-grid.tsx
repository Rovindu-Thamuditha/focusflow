
"use client"

import { useState } from 'react';
import { TimeBlock } from './time-block';
import { LogTimeDialog } from './log-time-dialog';
import type { TimeBlockState, Subject } from '@/lib/types';
import { differenceInHours, format } from 'date-fns';

interface AccountabilityGridProps {
  blocks: TimeBlockState[];
  subjects: Subject[];
  onBlockUpdate: (hour: number, subject: string, duration: number) => void;
  viewingDate: Date;
}

export function AccountabilityGrid({ blocks, subjects, onBlockUpdate, viewingDate }: AccountabilityGridProps) {
  const [selectedBlock, setSelectedBlock] = useState<TimeBlockState | null>(null);

  const isEditable = differenceInHours(new Date(), viewingDate) <= 36;

  const handleBlockClick = (hour: number) => {
    if (!isEditable) return;
    const block = blocks.find(b => b.hour === hour);
    if (block && block.subject !== 'sleep') {
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
      <h2 className="text-2xl font-bold mb-4 text-primary">24-Hour Focus Grid</h2>
      {!isEditable && (
         <p className="text-sm text-yellow-500 mb-4">You can only edit entries from the last 36 hours.</p>
      )}
      <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
        {blocks.map(block => (
          <TimeBlock
            key={`${format(viewingDate, 'yyyy-MM-dd')}-${block.hour}`}
            hour={block.hour}
            subjectId={block.subject}
            duration={block.duration}
            subjects={subjects}
            onClick={() => handleBlockClick(block.hour)}
            isEditable={isEditable}
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
