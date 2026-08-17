'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
  estimatedDate?: string;
}

export function ComingSoonModal({
  isOpen,
  onClose,
  feature,
  description,
  estimatedDate,
}: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-gradient-to-br from-[#1a1a1f] to-[#0f0f12] border border-gray-700 p-6 shadow-2xl animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{feature}</h2>
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          {description && (
            <p className="text-sm text-gray-300 mb-3">{description}</p>
          )}

          {estimatedDate && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-xs text-blue-300">{estimatedDate}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            기대할게요 ✨
          </button>
          <p className="text-center text-xs text-gray-500">
            업데이트 알림 받기는 프로필에서 설정할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
