"use client";

import { AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import { useState } from "react";

interface CheckPoint {
  id: string;
  stage: number;
  title: string;
  description: string;
  checks: {
    label: string;
    goodIndicator: string;
    badIndicator: string;
  }[];
}

/**
 * 포토카드 정품/가품 구별 체크포인트 3단계 가이드.
 * Mock 데이터 기반으로 직관적인 체크리스트 형태 제공.
 */
export function AuthenticityCheckGuide() {
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>({});

  const checkPoints: CheckPoint[] = [
    {
      id: "stage1",
      stage: 1,
      title: "절단면 마감 & 스프루 흔적",
      description: "카드 가장자리와 인쇄 접합부 상태 확인",
      checks: [
        {
          label: "절단면 마감",
          goodIndicator: "✓ 매끈한 가장자리, 불규칙한 톱니 없음",
          badIndicator: "✗ 거친 절단면, 흰 내부 노출, 들뜬 부분",
        },
        {
          label: "스프루(Sprue) 흔적",
          goodIndicator: "✓ 스프루 제거 흔적 거의 없음",
          badIndicator: "✗ 눈에 띄는 스프루 돌기, 제거 흔적 명백",
        },
        {
          label: "카드 휨/뒤틀림",
          goodIndicator: "✓ 완벽히 평평한 카드",
          badIndicator: "✗ 눈에 띄는 휨, 주름, 들뜬 모서리",
        },
      ],
    },
    {
      id: "stage2",
      stage: 2,
      title: "뒷면 로고 색감 & 인쇄 도트",
      description: "뒷면 색상 정확도와 점 패턴 검사",
      checks: [
        {
          label: "제조사 로고 색상",
          goodIndicator: "✓ 정확한 색상(예: 검은색/빨간색), 선명함",
          badIndicator: "✗ 퇴색, 불균형, 주황색/갈색 변색",
        },
        {
          label: "인쇄 도트 패턴",
          goodIndicator: "✓ 미세하고 균일한 CMYK 도트, 깔끔한 라인",
          badIndicator: "✗ 거친 도트, 불규칙, 번짐, 치우침",
        },
        {
          label: "텍스트 선명도",
          goodIndicator: "✓ 날카로운 글자, 모서리 깔끔",
          badIndicator: "✗ 흐릿한 글자, 번진 가장자리, 글자 찌그러짐",
        },
      ],
    },
    {
      id: "stage3",
      stage: 3,
      title: "빛 반사 코팅 질감",
      description: "표면 광택 처리와 UV 코팅 균일성 확인",
      checks: [
        {
          label: "광택 코팅 균일성",
          goodIndicator: "✓ 전체 표면 균일한 광택, 패턴 없음",
          badIndicator: "✗ 울퉁불퉁, 부분적 무광택, 코팅 벗겨짐",
        },
        {
          label: "반사 패턴",
          goodIndicator: "✓ 부드러운 거울 반사, 홀로그램 효과 정상",
          badIndicator: "✗ 주름진 반사, 홀로그램 흐릿함, 긁힘",
        },
        {
          label: "코팅 두께 일정성",
          goodIndicator: "✓ 가장자리까지 균일한 코팅",
          badIndicator: "✗ 가장자리 코팅 박함, 벗겨짐 위험",
        },
      ],
    },
  ];

  const toggleCheck = (checkId: string) => {
    setCompletedChecks((prev) => ({
      ...prev,
      [checkId]: !prev[checkId],
    }));
  };

  const totalChecks = checkPoints.reduce((sum, point) => sum + point.checks.length, 0);
  const completedCount = Object.values(completedChecks).filter(Boolean).length;
  const completionPercent = Math.round((completedCount / totalChecks) * 100);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 dark:border-neutral-700 dark:from-neutral-900/50 dark:to-neutral-900/30">
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white">
          🔍 정품 인증 체크리스트
        </h3>
        <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          3단계 세부 검사로 정품/가품 확률을 높이세요
        </p>
      </div>

      {/* 진행도 바 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <p className="font-medium text-neutral-700 dark:text-neutral-300">
            체크 진행도
          </p>
          <p className="text-nomad-red font-bold">{completionPercent}%</p>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-nomad-red to-red-500 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* 3단계 체크포인트 */}
      {checkPoints.map((point) => (
        <div
          key={point.id}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
        >
          {/* 단계 헤더 */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-nomad-red/10 text-nomad-red font-bold text-sm shrink-0">
              {point.stage}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                {point.title}
              </h4>
              <p className="text-xs text-neutral-600 mt-1 dark:text-neutral-400">
                {point.description}
              </p>
            </div>
          </div>

          {/* 체크항목 목록 */}
          <div className="space-y-3 ml-11">
            {point.checks.map((check, idx) => {
              const checkId = `${point.id}-${idx}`;
              const isChecked = completedChecks[checkId];

              return (
                <div
                  key={checkId}
                  onClick={() => toggleCheck(checkId)}
                  className={`rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    isChecked
                      ? "border-green-400 bg-green-50 dark:border-green-700/50 dark:bg-green-950/20"
                      : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900/30 dark:hover:border-neutral-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isChecked ? (
                      <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0 dark:text-green-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-neutral-300 mt-0.5 shrink-0 dark:border-neutral-600" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">
                        {check.label}
                      </p>

                      {/* Good Indicator */}
                      <div className="mt-2 flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0 dark:text-green-400" />
                        <p className="text-xs text-green-700 dark:text-green-300/80">
                          {check.goodIndicator}
                        </p>
                      </div>

                      {/* Bad Indicator */}
                      <div className="mt-1.5 flex items-start gap-2">
                        <XCircle size={14} className="text-red-600 mt-0.5 shrink-0 dark:text-red-400" />
                        <p className="text-xs text-red-700 dark:text-red-300/80">
                          {check.badIndicator}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 주의 사항 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5 dark:text-amber-400" />
          <div className="text-xs space-y-1 text-amber-800 dark:text-amber-300/80">
            <p className="font-bold">⚠️ 주의사항</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>모든 체크 완료 = 100% 정품 보증 아님 (참고용)</li>
              <li>의심 시 전문가 감정 추천</li>
              <li>구입 전 판매자에게 상세 사진 요청</li>
              <li>고급 위조품은 육안 구별 불가능할 수 있음</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 결과 요약 */}
      {completedCount > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5 dark:text-blue-400" />
            <div className="text-xs space-y-1 text-blue-800 dark:text-blue-300/80">
              <p className="font-bold">✓ 확인 결과</p>
              <p>
                {completedCount}/{totalChecks}개 항목 확인 완료
                {completionPercent === 100 && " — 정품일 가능성이 높습니다."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
