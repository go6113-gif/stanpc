"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";

interface CardWantButtonProps {
  cardId: string;
  isInitiallyWanted: boolean;
}

export function CardWantButton({
  cardId,
  isInitiallyWanted,
}: CardWantButtonProps) {
  const { data: session } = useSession();
  const [isWanted, setIsWanted] = useState(isInitiallyWanted);
  const [isLoading, setIsLoading] = useState(false);

  if (!session?.user?.id) {
    return null; // Hidden for non-logged-in users
  }

  const handleWantToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/card-want", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          isWant: !isWanted,
        }),
      });

      if (response.ok) {
        setIsWanted(!isWanted);
      }
    } catch (error) {
      console.error("Failed to toggle want status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleWantToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-colors ${
        isWanted
          ? "bg-[#FF4742] text-white hover:bg-[#E63D38]"
          : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
      } disabled:opacity-50`}
    >
      <Heart
        size={16}
        className={isWanted ? "fill-current" : ""}
      />
      Want
    </button>
  );
}
