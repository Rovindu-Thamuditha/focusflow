
"use client";

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { ScrollArea } from './ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FeedbackDialog } from './feedback-dialog';

interface WhatsNew {
  id: string;
  version: string;
  title: string;
  content: string;
  publishedAt: any;
}

export function InfoDialog() {
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

  const latestAnnouncement = latestAnnouncements?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="How to use">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <Tabs defaultValue="guide">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guide">How to Use</TabsTrigger>
            <TabsTrigger value="whatsnew" disabled={!latestAnnouncement}>What's New</TabsTrigger>
          </TabsList>
          <TabsContent value="guide">
            <DialogHeader>
              <DialogTitle>How to Use GridFocus</DialogTitle>
              <DialogDescription>
                A quick guide to tracking your focus and getting things done.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4 py-4 text-sm">
                  <div className="space-y-1">
                      <h4 className="font-semibold">1. Track Your Day</h4>
                      <p className="text-muted-foreground">The 24-hour grid represents your day. Each block is an hour. After an hour passes, you can click on its block to log your activity.</p>
                  </div>
                   <div className="space-y-1">
                      <h4 className="font-semibold">2. Log Your Focus Time</h4>
                      <p className="text-muted-foreground">When you click a block, a popup appears. Select the subject you worked on and enter how many minutes you were focused during that hour. Then hit "Save".</p>
                  </div>
                   <div className="space-y-1">
                      <h4 className="font-semibold">3. Use the Live Timer</h4>
                      <p className="text-muted-foreground">Click the Timer floating button to start a live session. It will automatically log your time to the current hour block.</p>
                  </div>
                   <div className="space-y-1">
                      <h4 className="font-semibold">4. View Your Stats</h4>
                      <p className="text-muted-foreground">Click the <span className="font-bold">Bar Chart</span> icon in the header to see a detailed graph of your focus time over different periods. This helps you understand your habits.</p>
                  </div>
                   <div className="space-y-1">
                      <h4 className="font-semibold">5. Manage Your Tasks</h4>
                      <p className="text-muted-foreground">Use the "Today's Tasks" list to add, check off, and delete your to-do items. It's a simple way to keep track of what you need to accomplish.</p>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-semibold">Have Feedback?</h4>
                      <p className="text-muted-foreground">Found a bug or have a feature idea? Let us know!</p>
                      <FeedbackDialog />
                  </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button onClick={() => setIsOpen(false)}>Got it!</Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="whatsnew">
             <DialogHeader>
              <DialogTitle>{latestAnnouncement?.title || "What's New"}</DialogTitle>
              <DialogDescription>
                The latest updates and features in GridFocus.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[50vh] pr-4">
              {isLoading ? (
                  <p className="py-4 text-muted-foreground">Loading...</p>
              ) : latestAnnouncement ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none py-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {latestAnnouncement.content}
                    </ReactMarkdown>
                  </div>
              ) : (
                  <p className="py-4 text-muted-foreground">No announcements yet.</p>
              )}
            </ScrollArea>
             <DialogFooter className="pt-4">
              <Button onClick={() => setIsOpen(false)}>Got it!</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
