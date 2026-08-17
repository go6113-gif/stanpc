'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, X, AlertCircle, Loader } from 'lucide-react';

interface ReviewItem {
  id: string;
  imageUrl: string;
  title: string;
  visionScore: number;
  visionReasoning: string;
  source: 'ebay' | 'naver';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

interface ReviewQueueViewerProps {
  onReviewComplete?: (id: string, status: string) => void;
}

/**
 * Admin Review Queue Viewer Component
 * Displays photocard listings pending manual review (Vision score 50-89)
 * Allows 1-click approval or rejection with reasoning display
 */
export function ReviewQueueViewer({ onReviewComplete }: ReviewQueueViewerProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/review-queue?status=PENDING&limit=20');
      const data = await response.json();
      setReviews(data.results || []);
      setStats({
        pending: data.total,
        approved: 0,
        rejected: 0,
      });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/review-queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        // Remove from list
        const newReviews = reviews.filter((r) => r.id !== id);
        setReviews(newReviews);

        // Update stats
        if (status === 'APPROVED') {
          setStats((s) => ({
            ...s,
            pending: s.pending - 1,
            approved: s.approved + 1,
          }));
        } else {
          setStats((s) => ({
            ...s,
            pending: s.pending - 1,
            rejected: s.rejected + 1,
          }));
        }

        onReviewComplete?.(id, status);

        // Move to next
        if (currentIndex >= newReviews.length) {
          setCurrentIndex(Math.max(0, newReviews.length - 1));
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading review queue...</p>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Clear!</h2>
          <p className="text-gray-600">No reviews pending. Great job! 🎉</p>
        </div>
      </div>
    );
  }

  const current = reviews[currentIndex];
  const progress = ((currentIndex + 1) / reviews.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🔍 Review Queue
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Pending', value: stats.pending, color: 'bg-yellow-100' },
              { label: 'Approved', value: stats.approved, color: 'bg-green-100' },
              { label: 'Rejected', value: stats.rejected, color: 'bg-red-100' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.color} rounded-lg p-4 text-center`}
              >
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {currentIndex + 1} / {reviews.length}
            </span>
          </div>
        </div>

        {/* Card Review */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Image Section */}
            <div className="relative bg-gray-100 aspect-[3/4] md:aspect-auto md:h-96">
              <Image
                src={current.imageUrl}
                alt={current.title}
                fill
                className="object-contain p-4"
              />

              {/* Source Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    current.source === 'ebay'
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  }`}
                >
                  {current.source.toUpperCase()}
                </span>
              </div>

              {/* Score Badge */}
              <div className="absolute top-4 right-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`px-4 py-2 rounded-full font-bold text-white ${
                    current.visionScore >= 50 && current.visionScore < 90
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                >
                  {current.visionScore} pts
                </motion.div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 md:p-8">
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {current.title}
              </h2>

              {/* Vision Reasoning */}
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">
                      Vision LLM Analysis
                    </p>
                    <p className="text-sm text-yellow-800">
                      {current.visionReasoning}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(current.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Source ID</p>
                  <p className="font-medium text-gray-900 font-mono text-xs">
                    {current.id}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReview(current.id, 'REJECTED')}
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Reject
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReview(current.id, 'APPROVED')}
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Approve
                </motion.button>
              </div>

              {submitting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Submitting...</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-gray-50 px-6 md:px-8 py-4 flex items-center justify-between border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0 || submitting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                ← Previous
              </motion.button>

              <span className="text-sm font-medium text-gray-600">
                Card {currentIndex + 1} of {reviews.length}
              </span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setCurrentIndex(Math.min(reviews.length - 1, currentIndex + 1))
                }
                disabled={currentIndex === reviews.length - 1 || submitting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                Next →
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
