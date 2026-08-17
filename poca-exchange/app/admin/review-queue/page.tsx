'use client';

import { ReviewQueueViewer } from '@/components/admin/ReviewQueueViewer';

/**
 * Admin Review Queue Page
 * Manual review interface for Vision LLM borderline cases (50-89 score)
 */

export default function ReviewQueuePage() {
  const handleReviewComplete = (id: string, status: string) => {
    console.log(`Review ${id} completed with status: ${status}`);
  };

  return <ReviewQueueViewer onReviewComplete={handleReviewComplete} />;
}
