'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEarlyBird: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function ComingSoonModal({
  isOpen,
  onClose,
  onEarlyBird,
  title,
  description,
  icon,
}: ComingSoonModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 p-8 text-white shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                {icon || (
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-12 h-12" />
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-center mb-3">{title}</h2>
              <p className="text-center text-white/90 mb-8 leading-relaxed">{description}</p>

              {/* Status Badge */}
              <div className="mb-8 text-center">
                <span className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur text-sm font-semibold">
                  🚀 곧 출시 예정
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={onEarlyBird}
                  className="w-full py-3 rounded-full bg-white text-purple-600 font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  얼리버드 혜택으로 먼저 만나기
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-full bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-colors"
                >
                  닫기
                </button>
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-white/70 mt-6">
                얼리버드 멤버가 되어 가장 먼저 새로운 기능을 경험하세요
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
