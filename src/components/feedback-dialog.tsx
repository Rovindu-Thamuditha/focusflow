
"use client";

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendFeedback } from '@/ai/flows/send-feedback-flow';
import { useUser } from '@/firebase';
import { Icons } from './icons';

export function FeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false);
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
    try {
        const result = await sendFeedback({ feedback, userEmail: user?.email });
        if (result.success) {
            toast({
                title: "Feedback Sent!",
                description: "Thank you for helping us improve GridFocus.",
            });
            setIsOpen(false);
            setFeedback("");
        } else {
             throw new Error("Flow returned success: false");
        }
    } catch (error) {
        console.error("Failed to send feedback:", error);
        toast({
            variant: "destructive",
            title: "Something went wrong",
            description: "Could not send your feedback. Please try again later.",
        });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90"
          title="Send Feedback"
        >
            <MessageSquarePlus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
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
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>Cancel</Button>
            <Button onClick={handleSendFeedback} disabled={isSending}>
                {isSending && <Icons.logo className="mr-2 h-4 w-4 animate-spin" />}
                {isSending ? 'Sending...' : 'Send Feedback'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
