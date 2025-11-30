"use client"

import { TimeBlock, type TimeBlockState, type TimeBlockStatus } from './time-block';

interface AccountabilityGridProps {
  blocks: TimeBlockState[];
  onBlockChange: (hour: number, newStatus: TimeBlockStatus) => void;
}

export function AccountabilityGrid({ blocks, onBlockChange }: AccountabilityGridProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-primary">24-Hour Focus Grid</h2>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {blocks.map(block => (
          <TimeBlock
            key={block.hour}
            hour={block.hour}
            status={block.status}
            onStatusChange={onBlockChange}
          />
        ))}
      </div>
    </div>
  );
}
