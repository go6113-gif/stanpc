'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Heart, Lock, Sparkles } from 'lucide-react';
import { PRICING_CONFIG, formatCurrency, getRecommendedCurrency } from '@/lib/config/pricing.config';

interface EarlyBirdPaymentModalProps {
  onClose?: () => void;
  onPurchase?: (priceUSD: number) => Promise<void>;
  currentSales?: number; // Number of completed sales (default: 1842)
  totalSlots?: number; // Total slots (default: 3000)
}

type Currency = 'USD' | 'KRW' | 'JPY' | 'EUR' | 'GBP';

const FEATURES = [
  '🤖 AI 스마트 자동 분류 (오픈 예정)',
  '🛡️ No-Touch 교환 카드 생성',
  '📊 실시간 시세 대시보드',
  '💾 무제한 바인더 소장',
  '🎨 SNS 자랑 템플릿',
  '🌍 글로벌 가격 비교',
];

export function EarlyBirdPaymentModal({
  onClose,
  onPurchase,
  currentSales = 1842,
  totalSlots = 3000,
}: EarlyBirdPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedCurrency, setRecommendedCurrency] = useState<Currency>('USD');
  const [localizedPrices, setLocalizedPrices] = useState<Record<Currency, string>>({
    USD: '',
    KRW: '',
    JPY: '',
    EUR: '',
    GBP: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const currency = getRecommendedCurrency();
    setRecommendedCurrency(currency);

    const earlyBirdPrice = PRICING_CONFIG.ORIGINAL_PRICE_USD * (1 - PRICING_CONFIG.DISCOUNT_RATE);
    const prices: Record<Currency, string> = {
      USD: formatCurrency(earlyBirdPrice, 'USD'),
      KRW: formatCurrency(earlyBirdPrice, 'KRW'),
      JPY: formatCurrency(earlyBirdPrice, 'JPY'),
      EUR: formatCurrency(earlyBirdPrice, 'EUR'),
      GBP: formatCurrency(earlyBirdPrice, 'GBP'),
    };
    setLocalizedPrices(prices);
  }, []);

  const handlePurchase = async () => {
    if (!onPurchase) return;

    setIsLoading(true);
    try {
      const earlyBirdPrice = PRICING_CONFIG.ORIGINAL_PRICE_USD * (1 - PRICING_CONFIG.DISCOUNT_RATE);
      await onPurchase(earlyBirdPrice);
      setShowSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error('Purchase failed:', error);
      setIsLoading(false);
    }
  };

  const progressPercent = (currentSales / totalSlots) * 100;
  const displayPrice = localizedPrices[recommendedCurrency] || `$${PRICING_CONFIG.ORIGINAL_PRICE_USD * (1 - PRICING_CONFIG.DISCOUNT_RATE)}`;
  const regularPrice = formatCurrency(PRICING_CONFIG.ORIGINAL_PRICE_USD, 'USD');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Close Button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-6 right-6 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </motion.button>

        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-800 -z-10" />

        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="payment-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 md:p-10"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full"
                >
                  <span className="text-xl">🔥</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">한정 특가</span>
                </motion.div>

                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
                  평생 덕질 편해지는 <br /> 치트키, 딱 3,000명만 💖
                </h1>

                <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  정식 출시되면 연 $24씩 계속 구독해야 해요. 지금 딱 한 번 {displayPrice} 결제하고,
                  AI 자동 분류부터 무제한 바인더까지 평생 소장하세요.
                </p>
              </div>

              {/* Price Box */}
              <div className="mb-8 p-8 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl border-2 border-blue-200 dark:border-blue-900">
                <div className="text-center mb-6">
                  <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    정식 출시 예정가
                  </div>
                  <div className="text-xl text-neutral-500 dark:text-neutral-400 line-through">
                    연 {regularPrice} 구독
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    (평생권 정가 ~~$36~~)
                  </div>
                </div>

                <div className="border-t border-neutral-300 dark:border-neutral-700 pt-6">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {displayPrice.replace(/[^0-9.]/g, '')}
                    </span>
                    {recommendedCurrency !== 'USD' && (
                      <span className="text-2xl text-neutral-600 dark:text-neutral-400">
                        {displayPrice.replace(/[0-9.]/g, '')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full">
                      <Sparkles className="w-3 h-3" />
                      50% OFF
                    </span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      1회 결제 / 평생 무제한
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    🔥 현재 {currentSales.toLocaleString()} / {totalSlots.toLocaleString()}명 결제 완료
                  </p>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    마감 임박
                  </p>
                </div>
                <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  {totalSlots - currentSales}명만 더 구입 가능
                </p>
              </div>

              {/* Features List */}
              <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3 uppercase">
                  포함되는 기능
                </p>
                <div className="space-y-2">
                  {FEATURES.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg rounded-xl hover:shadow-lg transition-shadow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      ✨ {displayPrice}로 평생 소장권 지금 결제하기
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-70"
                >
                  괜찮아요, 나중에 구독할게요
                </motion.button>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Lock className="w-3 h-3" />
                <span>Stripe로 안전하게 결제됩니다</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 md:p-10 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.8 }}
                className="text-6xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                결제 완료!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                평생 무제한 소장권을 얻었습니다. 이제 StanPC를 마음껏 즐기세요! 💖
              </p>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                ✨
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
