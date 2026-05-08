import { sendFeedback } from '@/ai/flows/send-feedback-flow';

const OFFLINE_FEEDBACK_QUEUE_KEY = 'offline_feedback_queue';

interface FeedbackPayload {
  feedback: string;
  userEmail?: string;
  timestamp: string;
}

/**
 * Saves a feedback submission to localStorage.
 * @param feedback The feedback data payload.
 */
export function saveFeedbackOffline(feedback: FeedbackPayload): void {
  try {
    const queue = getOfflineFeedbackQueue();
    queue.push(feedback);
    localStorage.setItem(OFFLINE_FEEDBACK_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save feedback to localStorage:", error);
  }
}

/**
 * Retrieves the feedback queue from localStorage.
 * @returns An array of feedback payloads.
 */
function getOfflineFeedbackQueue(): FeedbackPayload[] {
  try {
    const storedQueue = localStorage.getItem(OFFLINE_FEEDBACK_QUEUE_KEY);
    return storedQueue ? JSON.parse(storedQueue) : [];
  } catch (error) {
    console.error("Failed to read feedback queue from localStorage:", error);
    // If parsing fails, return an empty array to prevent app crash
    return [];
  }
}

/**
 * Attempts to send all queued offline feedback using the sendFeedback flow.
 * Removes successfully sent items from the queue.
 */
export async function syncOfflineFeedback(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return; // Don't try to sync if offline
  }

  const queue = getOfflineFeedbackQueue();
  if (queue.length === 0) {
    return;
  }

  console.log(`Attempting to sync ${queue.length} offline feedback items.`);

  const remainingFeedback: FeedbackPayload[] = [];
  
  for (const feedback of queue) {
    try {
      // Call flow directly instead of fetch
      const result = await sendFeedback(feedback);

      if (!result.success) {
        throw new Error(result.message || 'Sync failed');
      }
      
      console.log(`Successfully synced feedback from ${feedback.timestamp}`);

    } catch (error) {
      console.warn(`Failed to sync feedback from ${feedback.timestamp}. It will be retried later.`, error);
      remainingFeedback.push(feedback); // Add to a new array to keep it in the queue
    }
  }

  try {
    // Update localStorage with the items that failed to send
    localStorage.setItem(OFFLINE_FEEDBACK_QUEUE_KEY, JSON.stringify(remainingFeedback));
  } catch (error) {
    console.error("Failed to update feedback queue in localStorage after sync:", error);
  }
}
