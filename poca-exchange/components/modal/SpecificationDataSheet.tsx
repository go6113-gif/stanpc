"use client";

import { AlertCircle } from "lucide-react";

interface SpecItem {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
}

interface SpecificationDataSheetProps {
  groupName?: string | null;
  memberName?: string | null;
  cardName?: string;
}

/**
 * 포토카드 규격, 재질, 발매일, 에디션(럭드, 미공포 등) 정보를 보여주는
 * 표준 데이터 시트 컴포넌트. Mock 데이터 기반.
 */
export function SpecificationDataSheet({
  groupName = "Unknown Group",
  memberName,
  cardName = "Photocard",
}: SpecificationDataSheetProps) {
  // Mock spec data — in production, this would come from the card object
  const specs: SpecItem[] = [
    {
      label: "규격 (Size)",
      value: "56 × 87 mm",
      highlight: true,
    },
    {
      label: "권장 슬리브",
      value: "Standard Korean Sleeve (55 × 90 mm)",
    },
    {
      label: "재질 (Material)",
      value: "Glossy Cardstock",
    },
    {
      label: "인쇄 기법 (Print)",
      value: "4-Color Offset",
    },
    {
      label: "발매일 (Release Date)",
      value: "2024년 8월 15일",
      highlight: true,
    },
    {
      label: "앨범/이벤트 (Album)",
      value: "Summer Concept Album",
    },
    {
      label: "버전/에디션",
      value: "Standard Edition (SE)",
    },
    {
      label: "희소성 등급 (Rarity)",
      value: (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-nomad-red/10 px-3 py-1 text-xs font-bold text-nomad-red">
          ⭐ ULTRA RARE
        </span>
      ),
      highlight: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 dark:border-neutral-700 dark:from-neutral-900/50 dark:to-neutral-900/30">
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white">
          📋 표준 규격 데이터 시트
        </h3>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          {groupName}
          {memberName && ` · ${memberName}`}
        </p>
      </div>

      {/* 메인 규격 테이블 */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="w-full text-sm">
          <tbody>
            {specs.map((spec, idx) => (
              <tr
                key={idx}
                className={`border-b border-neutral-100 last:border-b-0 dark:border-neutral-800 ${
                  spec.highlight
                    ? "bg-blue-50/50 dark:bg-blue-900/20"
                    : "bg-white dark:bg-neutral-950"
                }`}
              >
                <td className="w-2/5 px-4 py-3.5 font-medium text-neutral-600 dark:text-neutral-400">
                  {spec.label}
                </td>
                <td className="w-3/5 px-4 py-3.5 text-neutral-900 dark:text-neutral-100">
                  <div className="flex items-center gap-2">
                    {spec.value}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 추가 정보 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 권장 보관 방식 */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-400">
            💾 보관 팁
          </p>
          <p className="mt-1.5 text-xs text-amber-800 dark:text-amber-300/80">
            습기 차단 보관, UV 차단 슬리브 권장
          </p>
        </div>

        {/* 인증 정보 */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-950/20">
          <p className="text-xs font-bold uppercase tracking-wide text-green-900 dark:text-green-400">
            ✓ 인증 정보
          </p>
          <p className="mt-1.5 text-xs text-green-800 dark:text-green-300/80">
            Official Licensed · QC Passed
          </p>
        </div>
      </div>

      {/* 참고 사항 */}
      <div className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-neutral-500 dark:text-neutral-400" />
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          표시된 규격은 표준 사이즈입니다. 제조사마다 ±1-2mm 오차가 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
