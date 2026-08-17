"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "아티스트 탭에서",
    description: "좋아하는 그룹을 선택하세요",
    icon: "🎤",
    action: "그룹 선택",
  },
  {
    id: 2,
    title: "포토카드를 발견하고",
    description: "보유 상태를 표시하세요 💎",
    icon: "🖼️",
    action: "카드 추가",
  },
  {
    id: 3,
    title: "첫 포카 슬롯에서",
    description: "AI가 자동으로 분류해줄 거예요 ✨",
    icon: "🪄",
    action: "완료",
  },
];

interface OnboardingSpotlightProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingSpotlight({ isOpen = true, onClose }: OnboardingSpotlightProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose?.();
    }
  };

  const handleSkip = () => {
    onClose?.();
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
            onClick={handleSkip}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                <div className="text-4xl mb-3">{step.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                <p className="text-purple-100">{step.description}</p>
              </div>

              <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {currentStep + 1} / {ONBOARDING_STEPS.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              <div className="p-6 space-y-6">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </motion.div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                  >
                    건너뛰기
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {step.action}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-2 justify-center">
                {ONBOARDING_STEPS.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx <= currentStep
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-gray-300"
                    }`}
                    style={{
                      width: idx === currentStep ? "24px" : "8px",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
