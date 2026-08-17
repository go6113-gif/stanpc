"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Heart, Lock } from "lucide-react";

interface EarlyBirdPaymentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onPayment?: () => void;
}

const PAYMENT_HIGHLIGHTS = [
  { icon: "🪄", text: "AI 자동 분류" },
  { icon: "📦", text: "무제한 바인더" },
  { icon: "💎", text: "평생 소장권" },
  { icon: "🌍", text: "3개국 실시간 가격" },
];

export function EarlyBirdPaymentModal({
  isOpen = true,
  onClose,
  onPayment,
}: EarlyBirdPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const soldCount = 1842;
  const totalCount = 3000;
  const progress = (soldCount / totalCount) * 100;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceUSD: 18 }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout failed:', data.error);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              {/* Header with Flame Icon */}
              <div className="relative bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 p-8 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-7 h-7 animate-bounce" />
                  <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                    얼리버드 50% 할인
                  </span>
                </div>

                <h2 className="text-4xl font-bold mb-2">
                  평생 덕질 편해지는 치트키
                </h2>
                <p className="text-orange-50 text-lg">
                  딱 3,000명만 50% 혜택 💖
                </p>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* Problem/Solution */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="text-2xl">⏱️</div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">
                        정식 출시 시
                      </h3>
                      <p className="text-gray-600">
                        연 <span className="line-through">$24</span> 계속
                        구독해야 해요
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">✨</div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">
                        지금 구매 시
                      </h3>
                      <p className="text-gray-600">
                        딱 한 번{" "}
                        <span className="font-bold text-orange-600">$18</span>{" "}
                        결제하고, AI 자동 분류부터 무제한 바인더까지{" "}
                        <span className="font-bold">평생 소장</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {PAYMENT_HIGHLIGHTS.map((highlight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100"
                    >
                      <div className="text-3xl mb-2">{highlight.icon}</div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {highlight.text}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="font-bold text-gray-900">
                        {soldCount.toLocaleString()} / {totalCount.toLocaleString()}명
                        결제 완료
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-orange-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                    />
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-6 rounded-xl border-2 border-orange-200">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-gray-600 text-lg">가격</span>
                    <span className="text-5xl font-black text-orange-600">$18</span>
                    <span className="text-gray-500 line-through">$36</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    50% 얼리버드 할인가 (3,000명 한정)
                  </p>
                </div>
              </div>

              {/* Footer with CTA */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Flame className="w-5 h-5" />
                  {isProcessing ? "결제 중..." : "$18 지금 결제"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
