'use client';

import { ArrowRight, Heart, Zap } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, PRICING_CONFIG } from '@/lib/config/pricing.config';

/**
 * 바이럴 추천 CTA (Call-To-Action)
 *
 * 랜딩페이지 또는 프로필 페이지에서 사용
 */
export function ViralReferralCTA() {
  const initialPrice = PRICING_CONFIG.ORIGINAL_PRICE_USD;
  const renewalPrice = PRICING_CONFIG.ANNUAL_RENEWAL_USD;
  const referralTarget = 2; // 2명 추천 = 1년 무료

  return (
    <div className="space-y-6">
      {/* 메인 헤더 */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white">
          📚 오프라인 바인더 1권 가격({formatCurrency(initialPrice)})으로
        </h1>
        <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          평생 디지털 바인더 소장!
        </p>
      </div>

      {/* 비교 섹션 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 실물 바인더 */}
        <div className="bg-white dark:bg-neutral-950 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 p-6 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-white">
            <Heart className="w-6 h-6 text-red-500" />
            실물 바인더
          </div>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>✗ 15,000원 + 추가 비용 계속 발생</li>
            <li>✗ 80장 넣으면 끝 (용량 제한)</li>
            <li>✗ 무겁고 휴대 불편</li>
            <li>✗ 사진 일일이 찍어야 함</li>
            <li>✗ 시세 변동 추적 불가</li>
          </ul>
        </div>

        {/* StanPC 디지털 바인더 */}
        <div className="bg-gradient-to-br from-pink-50 dark:from-pink-950/30 to-purple-50 dark:to-purple-950/30 rounded-xl border-2 border-pink-500 dark:border-pink-700 p-6 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-pink-700 dark:text-pink-300">
            <Zap className="w-6 h-6" />
            StanPC 평생 바인더
          </div>
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>✓ {formatCurrency(initialPrice)} 한 번만 결제 (평생)</li>
            <li>✓ 무제한 바인더 수 + 무제한 카드</li>
            <li>✓ 언제 어디서나 클라우드 접근</li>
            <li>✓ 실시간 시세 자동 동기화</li>
            <li>✓ SNS 3초 원클릭 배포</li>
          </ul>
        </div>
      </div>

      {/* VIP 추천 이벤트 */}
      <div className="bg-gradient-to-r from-amber-100 dark:from-amber-950/30 to-orange-100 dark:to-orange-950/30 rounded-2xl border-2 border-amber-500 dark:border-amber-700 p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold text-sm">
            🎁 VIP 추천 이벤트
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
            딱 친구 {referralTarget}명만 추천하면 다음 해 유지비 {formatCurrency(renewalPrice)} → $0
          </h2>
        </div>

        {/* 추천 단계 */}
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="pt-1">
              <div className="font-semibold text-neutral-900 dark:text-white">
                친구 1명 결제 시
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                다음 해 구독료 <span className="font-bold text-pink-600">50% 할인</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="pt-1">
              <div className="font-semibold text-neutral-900 dark:text-white">
                친구 2명 결제 시
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                다음 해 연간 유지비({formatCurrency(renewalPrice)}) <span className="font-bold text-green-600">100% 전액 무료</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="pt-1">
              <div className="font-semibold text-neutral-900 dark:text-white">
                2명 이후 추가 추천
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                다다음 해, 평생 유지비까지 <span className="font-bold text-blue-600">무제한 누적 지원</span>!
              </p>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <Link
          href="/pricing#referral"
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
        >
          추천 링크 받기
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* 추가 이점 */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
        <h3 className="font-bold text-neutral-900 dark:text-white">💎 추가 이점</h3>
        <ul className="grid md:grid-cols-2 gap-4 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-pink-600 font-bold mt-0.5">✓</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              <strong>한정판 테마 & 스킨</strong> 해금 (4명 추천 시)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-600 font-bold mt-0.5">✓</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              <strong>커스텀 도메인</strong> 연결권 (8명 추천 시)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-600 font-bold mt-0.5">✓</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              <strong>'Top Ambassador' 마크</strong> 획득 (16명 추천 시)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-600 font-bold mt-0.5">✓</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              <strong>최상단 노출 부스트</strong> (교환 탐색 시)
            </span>
          </li>
        </ul>
      </div>

      {/* FAQ 간단 */}
      <div className="space-y-3">
        <h3 className="font-bold text-neutral-900 dark:text-white">❓ FAQ</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong className="text-neutral-900 dark:text-white">Q. 현금 환급이 가능한가요?</strong>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              아니요. 모든 크레딧은 플랫폼 내부 구독 연장 및 디지털 특전 전용이며, 현금 출금은 불가합니다.
            </p>
          </div>
          <div>
            <strong className="text-neutral-900 dark:text-white">Q. 추천인이 환불하면?</strong>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              추천인의 결제가 취소되면, 지급받았던 크레딧은 자동으로 회수됩니다.
            </p>
          </div>
          <div>
            <strong className="text-neutral-900 dark:text-white">Q. 크레딧 한도가 있나요?</strong>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              아니요. 무제한 추천으로 무제한 크레딧을 적립할 수 있습니다!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
