
"use client"

import { useState } from 'react';
import { TimeBlock } from './time-block';
import { LogTimeDialog } from './log-time-dialog';
import type { TimeBlockState, Subject } from '@/lib/types';
import { differenceInHours, format, isToday } from 'date-fns';

interface AccountabilityGridProps {
  blocks: TimeBlockState[];
  subjects: Subject[];
  onBlockUpdate: (hour: number, subject: string, duration: number) => void;
  viewingDate: Date;
  liveTime: Date;
  activeTimerSubject: Subject | null;
}

export function AccountabilityGrid({ blocks, subjects, onBlockUpdate, viewingDate, liveTime, activeTimerSubject }: AccountabilityGridProps) {
  const [selectedBlock, setSelectedBlock] = useState<TimeBlockState | null>(null);

  const isEditableDate = differenceInHours(new Date(), viewingDate) <= 36;
  const isViewingToday = isToday(viewingDate);
  const currentHour = liveTime.getHours();

  const handleBlockClick = (hour: number) => {
    const isFutureOrCurrentBlock = isViewingToday && hour >= currentHour;

    if (!isEditableDate || isFutureOrCurrentBlock) return;
    
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
  
  const handleClear = () => {
    if (selectedBlock) {
      onBlockUpdate(selectedBlock.hour, 'idle', 0);
      setSelectedBlock(null);
    }
  };

  const blocksToRender = blocks.slice(0, 24);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-primary">24-Hour Focus Grid</h2>
      {!isEditableDate && (
         <p className="text-sm text-yellow-500 mb-4">You can only edit entries from the last 36 hours.</p>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {blocksToRender.map(block => {
            const isFutureBlock = isViewingToday && block.hour > currentHour;
            const isCurrentBlock = isViewingToday && block.hour === currentHour;
            return (
              <TimeBlock
                key={`${format(viewingDate, 'yyyy-MM-dd')}-${block.hour}`}
                hour={block.hour}
                subjectId={block.subject}
                duration={block.duration}
                subjects={subjects}
                onClick={() => handleBlockClick(block.hour)}
                onWakeUp={() => onBlockUpdate(block.hour, 'idle', 0)}
                isEditable={isEditableDate}
                isFuture={isFutureBlock}
                isCurrent={isCurrentBlock}
                liveTime={liveTime}
                activeTimerSubject={isCurrentBlock ? activeTimerSubject : null}
              />
            );
        })}
      </div>
      {selectedBlock && (
        <LogTimeDialog
          block={selectedBlock}
          subjects={subjects}
          onSave={handleDialogSave}
          onClose={() => setSelectedBlock(null)}
          onClear={handleClear}
        />
      )}
    </div>
  );
}
