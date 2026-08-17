'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, X } from 'lucide-react';
import { EarlyBirdPaymentModal } from '@/components/onboarding/EarlyBirdPaymentModal';

export function EarlyBirdBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Flame className="w-5 h-5 animate-bounce" />
            <div className="text-sm sm:text-base font-semibold">
              <span className="hidden sm:inline">🎉 </span>
              평생 덕질 $18에 지금 <span className="font-bold">50% 할인</span> - 3,000명 한정
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1 bg-white text-orange-600 text-xs sm:text-sm font-bold rounded-full hover:bg-orange-50 transition-colors whitespace-nowrap"
            >
              지금 구매
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <EarlyBirdPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onPayment={() => console.log('Payment initiated')}
      />
    </>
  );
}
