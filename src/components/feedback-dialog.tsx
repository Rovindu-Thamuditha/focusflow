
"use client";

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const FEEDBACK_EMAIL = "rovinduthamuditha0@gmail.com";

export function FeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const handleSendFeedback = () => {
    if (feedback.trim().length < 10) {
        toast({
            variant: "destructive",
            title: "Feedback too short",
            description: "Please provide a bit more detail in your feedback.",
        });
        return;
    }
    const subject = "GridFocus App Feedback";
    const mailtoLink = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(feedback)}`;
    window.location.href = mailtoLink;
    setIsOpen(false);
    setFeedback("");
    toast({
        title: "Redirecting to Email Client",
        description: "Please send the pre-filled email from your mail app.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" title="Send Feedback">
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            Feedback
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
                />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSendFeedback}>Send via Email</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
