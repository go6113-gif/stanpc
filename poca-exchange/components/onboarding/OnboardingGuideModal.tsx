"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2, Upload, Shield } from "lucide-react";

const GUIDE_SECTIONS = [
  {
    icon: <Upload className="w-6 h-6" />,
    title: "업로드만 하면 돼요",
    description: "분류는 StanPC가 알아서 다 해줄게요 🪄",
    detail:
      "그룹, 앨범, 버전 일일이 찾아서 누르지 마세요. 사진만 올리면 AI가 멤버·미공포까지 알아서 꽂아줍니다.",
  },
  {
    icon: <Wand2 className="w-6 h-6" />,
    title: "Have & Want 가치 체감",
    description: "실시간 가격 비교 & P2P 교환 매칭",
    detail:
      "보유한 카드의 현재 시세를 3개국(한국·미국·일본) 실시간으로 확인하고, 원하는 카드와 즉시 교환할 수 있습니다.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "실물카드 No Touch",
    description: "슬리브에서 꺼내지 마세요. StanPC가 있잖아요 🛡️",
    detail:
      "클릭 한 번으로 Have & Want를 완성하세요. 카드 손상 걱정 없이 바인더를 온전히 즐기세요.",
  },
];

interface OnboardingGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingGuideModal({
  isOpen = true,
  onClose,
}: OnboardingGuideModalProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const section = GUIDE_SECTIONS[currentSection];

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
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold mb-2">AI 자동 분류</h2>
                <p className="text-blue-100">업로드만 하면 StanPC가 알아서 다 해줄게요</p>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {/* Sections List */}
                <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 p-4 space-y-2">
                  {GUIDE_SECTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSection(idx)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        idx === currentSection
                          ? "bg-blue-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`${
                            idx === currentSection
                              ? "text-white"
                              : "text-blue-500"
                          }`}
                        >
                          {s.icon}
                        </div>
                        <div className="text-sm font-medium">{s.title}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Detail View */}
                <div className="md:col-span-2 p-8">
                  <motion.div
                    key={currentSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6 text-blue-500 text-5xl">
                      {section.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-lg text-blue-600 font-semibold mb-4">
                      {section.description}
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      {section.detail}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {currentSection + 1} / {GUIDE_SECTIONS.length}
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
