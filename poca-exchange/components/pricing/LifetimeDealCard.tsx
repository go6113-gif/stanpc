'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import {
  PRICING_CONFIG,
  formatCurrency,
  getRecommendedCurrency,
  calculateReferralBenefit,
} from '@/lib/config/pricing.config';
import { generateReferralLink } from '@/lib/utils/referral';

interface LifetimeDealCardProps {
  referralCode?: string;
  userName?: string;
  onPurchase?: () => void;
}

type Currency = 'USD' | 'KRW' | 'JPY' | 'EUR' | 'GBP';

/**
 * 글로벌 평생 거래 카드
 *
 * - USD 기준 가격 표시
 * - 브라우저 로케일에 따른 현지 통화 변환
 * - 추천 링크 공유 기능
 * - 가치 비교표
 */
export function LifetimeDealCard({
  referralCode,
  userName,
  onPurchase,
}: LifetimeDealCardProps) {
  const [priceInfo, setPriceInfo] = useState<{ original: number; final: number } | null>(null);
  const [recommendedCurrency, setRecommendedCurrency] = useState<Currency>('USD');
  const [copied, setCopied] = useState(false);
  const [localizedPrices, setLocalizedPrices] = useState<Record<Currency, string>>({
    USD: '',
    KRW: '',
    JPY: '',
    EUR: '',
    GBP: '',
  });

  // 클라이언트사이드 초기화
  useEffect(() => {
    const original = PRICING_CONFIG.ORIGINAL_PRICE_USD;
    const discountAmount = original * PRICING_CONFIG.DISCOUNT_RATE;
    const final = original - discountAmount;

    setPriceInfo({ original, final });

    const currency = getRecommendedCurrency();
    setRecommendedCurrency(currency);

    // 모든 통화로 변환
    const prices: Record<Currency, string> = {
      USD: formatCurrency(final, 'USD'),
      KRW: formatCurrency(final, 'KRW'),
      JPY: formatCurrency(final, 'JPY'),
      EUR: formatCurrency(final, 'EUR'),
      GBP: formatCurrency(final, 'GBP'),
    };
    setLocalizedPrices(prices);
  }, []);

  if (!priceInfo) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
        <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
    );
  }

  const referralLink = referralCode ? generateReferralLink(referralCode) : null;
  const displayPrice = localizedPrices[recommendedCurrency];
  const referrerReward = PRICING_CONFIG.REFERRER_PER_USER_CREDITS / PRICING_CONFIG.POINTS_PER_USD;
  const refereeWelcome = PRICING_CONFIG.REFEREE_WELCOME_CREDITS / PRICING_CONFIG.POINTS_PER_USD;

  const handleCopyLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'stanpc 평생 거래',
          text: `내 추천 링크로 회원가입하면 ${PRICING_CONFIG.REFEREE_WELCOME_CREDITS}크레딧을 받을 수 있어요!`,
          url: referralLink,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border-2 border-[#FF2A55]/30 bg-gradient-to-br from-[#FF2A55]/5 to-transparent dark:from-[#FF2A55]/10 backdrop-blur-sm p-8 space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="inline-block rounded-lg bg-[#FF2A55]/20 px-3 py-1 text-sm font-semibold text-[#FF2A55]">
          🎉 평생 거래 (평생 접근권)
        </div>
        <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">
          stanpc Lifetime
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          포토카드 컬렉션을 영원히 관리하고 자랑하세요
        </p>
      </div>

      {/* 가격 */}
      <div className="space-y-3 rounded-xl bg-white dark:bg-neutral-900/50 p-4 border border-neutral-100 dark:border-neutral-800">
        {PRICING_CONFIG.DISCOUNT_RATE > 0 && (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">원가</span>
            <span className="text-lg line-through text-neutral-400">
              {formatCurrency(priceInfo.original, recommendedCurrency)}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            지금 가격
          </span>
          <div className="text-4xl font-bold text-[#FF2A55]">{displayPrice}</div>
        </div>
        {PRICING_CONFIG.DISCOUNT_RATE > 0 && (
          <div className="text-xs text-green-600 dark:text-green-400">
            {(PRICING_CONFIG.DISCOUNT_RATE * 100).toFixed(0)}% 할인
          </div>
        )}
      </div>

      {/* 포함 사항 */}
      <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
        <li className="flex items-center gap-2">
          <span className="text-[#FF2A55]">✓</span>
          평생 접근권 (1회 결제)
        </li>
        <li className="flex items-center gap-2">
          <span className="text-[#FF2A55]">✓</span>
          무제한 컬렉션 저장
        </li>
        <li className="flex items-center gap-2">
          <span className="text-[#FF2A55]">✓</span>
          모든 기능 사용 가능
        </li>
        <li className="flex items-center gap-2">
          <span className="text-[#FF2A55]">✓</span>
          추천인 수수료 {formatCurrency(referrerReward)} ({PRICING_CONFIG.REFERRER_PER_USER_CREDITS}P 무료)
        </li>
      </ul>

      {/* 구매 버튼 */}
      <button
        onClick={onPurchase}
        className="w-full rounded-lg bg-[#FF2A55] px-6 py-3 font-semibold text-white hover:bg-[#FF2A55]/90 transition-colors"
      >
        지금 구매
      </button>

      {/* 추천 링크 */}
      {referralLink && (
        <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
            추천하고 수입 얻기
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  링크 복사
                </>
              )}
            </button>
            <button
              onClick={handleShareLink}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              공유
            </button>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            추천 링크: {referralLink}
          </p>
        </div>
      )}

      {/* 가치 비교표 */}
      <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <div className="text-sm font-semibold text-neutral-900 dark:text-white">
          가치 비교
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-neutral-50 dark:bg-neutral-900 p-2">
            <div className="text-neutral-600 dark:text-neutral-400">온라인 구독</div>
            <div className="font-semibold text-neutral-900 dark:text-white">
              월 {formatCurrency(5, recommendedCurrency)}
            </div>
            <div className="text-gray-400">1년 시 {formatCurrency(60, recommendedCurrency)}</div>
          </div>
          <div className="rounded bg-green-50 dark:bg-green-950 p-2 border border-green-200 dark:border-green-800">
            <div className="font-semibold text-green-700 dark:text-green-300">stanpc</div>
            <div className="font-bold text-green-900 dark:text-green-200">
              {displayPrice}
            </div>
            <div className="text-green-600 dark:text-green-400">평생</div>
          </div>
        </div>
      </div>

      {/* 통화 선택기 (선택사항) */}
      <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          통화 선택
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['USD', 'KRW', 'EUR', 'JPY', 'GBP'] as const).map((currency) => (
            <button
              key={currency}
              onClick={() => setRecommendedCurrency(currency)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                recommendedCurrency === currency
                  ? 'bg-[#FF2A55] text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-xs text-neutral-600 dark:text-neutral-400">
        <div>
          <strong>평생 접근권이란?</strong> 한 번의 구매로 평생 이용할 수 있습니다.
        </div>
        <div>
          <strong>추천 크레딧은?</strong> 친구가 가입하면 {PRICING_CONFIG.REFERRER_PER_USER_CREDITS}
          포인트({formatCurrency(referrerReward)})를 받습니다.
        </div>
      </div>
    </div>
  );
}
