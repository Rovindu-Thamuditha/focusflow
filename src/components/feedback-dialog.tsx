
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Icons } from './icons';
import { saveFeedbackOffline, syncOfflineFeedback } from '@/lib/feedback-manager';

interface FeedbackDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function FeedbackDialog({ isOpen, onOpenChange }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleSendFeedback = async () => {
    if (feedback.trim().length < 10) {
        toast({
            variant: "destructive",
            title: "Feedback too short",
            description: "Please provide a bit more detail in your feedback.",
        });
        return;
    }

    setIsSending(true);
    const feedbackData = { feedback, userEmail: user?.email ?? 'anonymous', timestamp: new Date().toISOString() };

    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error('Offline');
        }

        const response = await fetch('/api/send-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });

        if (!response.ok) {
            throw new Error('API Error');
        }

        const result = await response.json();

        if (result.success) {
            toast({
                title: "Feedback Sent!",
                description: "Thank you for helping us improve GridFocus.",
            });
            await syncOfflineFeedback(); // Attempt to send any previously queued feedback
        } else {
            throw new Error(result.details || "API returned an error");
        }

    } catch (error) {
        console.warn("Could not send feedback directly, saving offline.", error);
        saveFeedbackOffline(feedbackData);
        toast({
            title: "Feedback Saved Offline",
            description: "We'll send your feedback automatically when you're back online.",
        });
    } finally {
        onOpenChange(false);
        setFeedback("");
        setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Have a suggestion or found a bug? Let us know!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
                <Label htmlFor="feedback-message">Your Message</Label>
                <Textarea 
                    placeholder="Type your feedback here..." 
                    id="feedback-message"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    disabled={isSending}
                />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancel</Button>
            <Button onClick={handleSendFeedback} disabled={isSending}>
                {isSending && <Icons.logo className="mr-2 h-4 w-4 animate-spin" />}
                {isSending ? 'Sending...' : 'Send Feedback'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
