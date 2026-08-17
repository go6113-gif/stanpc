import { ReviewQueueViewer } from '@/components/admin/ReviewQueueViewer';

/**
 * Admin Review Queue Page
 * Manual review interface for Vision LLM borderline cases (50-89 score)
 */

export default function ReviewQueuePage() {
  return (
    <ReviewQueueViewer
      onReviewComplete={(id, status) => {
        console.log(`Review ${id} completed with status: ${status}`);
      }}
    />
  );
}
