"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export type CardStatus = "owned" | "wish" | "nowish";

interface PhotocardSlotProps {
  cardId?: string;
  imageUrl?: string | null;
  memberName?: string;
  status?: CardStatus;
  onStatusChange?: (status: CardStatus) => void;
  isPlaceholder?: boolean;
}

export function PhotocardSlot({
  cardId,
  imageUrl,
  memberName = "Unknown",
  status = "nowish",
  onStatusChange,
  isPlaceholder = true,
}: PhotocardSlotProps) {
  const [localStatus, setLocalStatus] = useState<CardStatus>(status);
  const [showToast, setShowToast] = useState(false);

  const handleStatusChange = (newStatus: CardStatus) => {
    setLocalStatus(newStatus);
    onStatusChange?.(newStatus);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const isOwned = localStatus === "owned";
  const isWish = localStatus === "wish";
  const isNoWish = localStatus === "nowish";

  return (
    <div className="relative">
      {/* Card Slot Container */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md transition-all ${
          isNoWish
            ? "bg-gradient-to-br from-gray-300 to-gray-400 opacity-50"
            : "bg-gradient-to-br from-blue-100 to-purple-100"
        }`}
      >
        {/* Image */}
        <div className="absolute inset-0">
          {imageUrl && !isPlaceholder ? (
            <img
              src={imageUrl}
              alt={memberName}
              className={`w-full h-full object-cover ${isNoWish ? "grayscale" : ""}`}
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-4xl font-bold ${
                isNoWish ? "text-gray-400" : "text-purple-300"
              }`}
            >
              🖼️
            </div>
          )}
        </div>

        {/* Badge Overlay */}
        <div className="absolute top-2 right-2">
          {isOwned && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
            >
              💎 소장
            </motion.div>
          )}
          {isWish && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
            >
              💖 위시
            </motion.div>
          )}
        </div>

        {/* Member Label */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white px-2 py-1 text-xs font-semibold">
          {memberName}
        </div>

        {/* No Wish State - Add to Wish Button */}
        {isNoWish && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleStatusChange("wish")}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all"
          >
            <div className="bg-white/90 hover:bg-white px-3 py-2 rounded-full flex items-center gap-2 font-semibold text-gray-900 transition-all">
              <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
              위시 추가
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* Status Buttons - Visible on Hover */}
      {!isNoWish && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-10 left-0 right-0 flex gap-2 justify-center pt-2"
        >
          <button
            onClick={() => handleStatusChange("wish")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isWish
                ? "bg-pink-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            💖 위시
          </button>
          <button
            onClick={() => handleStatusChange("owned")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isOwned
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            💎 보유
          </button>
          <button
            onClick={() => handleStatusChange("nowish")}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
          >
            ✕ 제거
          </button>
        </motion.div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
        >
          {localStatus === "owned"
            ? "💎 보유로 변경됨"
            : localStatus === "wish"
              ? "💖 위시로 변경됨"
              : "✕ 제거됨"}
        </motion.div>
      )}
    </div>
  );
}
