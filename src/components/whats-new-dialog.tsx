
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

interface WhatsNew {
  id: string;
  version: string;
  title: string;
  content: string;
  publishedAt: any;
}

interface WhatsNewDialogProps {
    seenVersions: string[];
    onMarkAsSeen: (version: string) => void;
}

export function WhatsNewDialog({ seenVersions, onMarkAsSeen }: WhatsNewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();

  const whatsnewCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'whatsnew');
  }, [firestore]);

  const latestAnnouncementsQuery = useMemoFirebase(() => {
    if (!whatsnewCollectionRef) return null;
    return query(whatsnewCollectionRef, orderBy('publishedAt', 'desc'), limit(1));
  }, [whatsnewCollectionRef]);

  const { data: latestAnnouncements, isLoading } = useCollection<WhatsNew>(latestAnnouncementsQuery);

  const announcement = latestAnnouncements?.[0];

  useEffect(() => {
    if (announcement && !seenVersions.includes(announcement.version) && !isLoading) {
      setIsOpen(true);
    }
  }, [announcement, seenVersions, isLoading]);

  const handleClose = () => {
    if (announcement) {
        onMarkAsSeen(announcement.version);
    }
    setIsOpen(false);
  };

  if (!announcement || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{announcement.title}</DialogTitle>
          <DialogDescription>Here's what's new in GridFocus!</DialogDescription>
        </DialogHeader>
        <div 
          className="prose prose-sm dark:prose-invert max-w-none py-4"
          dangerouslySetInnerHTML={{ __html: announcement.content.replace(/\n/g, '<br />') }}
        >
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
