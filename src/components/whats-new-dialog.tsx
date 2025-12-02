
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{announcement.title}</DialogTitle>
          <DialogDescription>Here's what's new in GridFocus!</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {announcement.content}
                </ReactMarkdown>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleClose}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
