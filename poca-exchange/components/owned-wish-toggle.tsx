"use client";

import { useEffect, useState } from "react";

export function OwnedWishToggle({
  cardSlug,
  initialOwnedCount,
  initialWishedCount,
}: {
  cardSlug: string;
  initialOwnedCount: number;
  initialWishedCount: number;
}) {
  const [ownedCount, setOwnedCount] = useState(initialOwnedCount);
  const [wishedCount, setWishedCount] = useState(initialWishedCount);
  const [owns, setOwns] = useState(false);
  const [wishes, setWishes] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR, so state defaults to false on
    // the server and hydrates from the client-only store once mounted here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwns(localStorage.getItem(`stanpc:owned:${cardSlug}`) === "1");
    setWishes(localStorage.getItem(`stanpc:wished:${cardSlug}`) === "1");
  }, [cardSlug]);

  async function toggle(type: "owned" | "wished") {
    const active = type === "owned" ? owns : wishes;
    const nextValue = !active;
    const setActive = type === "owned" ? setOwns : setWishes;
    const setCount = type === "owned" ? setOwnedCount : setWishedCount;

    setActive(nextValue);
    setCount((count) => count + (nextValue ? 1 : -1));
    localStorage.setItem(
      `stanpc:${type}:${cardSlug}`,
      nextValue ? "1" : "0"
    );

    try {
      const res = await fetch(`/api/cards/${cardSlug}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value: nextValue }),
      });
      if (!res.ok) throw new Error("toggle failed");
      const data = await res.json();
      setOwnedCount(data.ownedCount);
      setWishedCount(data.wishedCount);
    } catch {
      // Roll back the optimistic update on failure.
      setActive(active);
      setCount((count) => count + (nextValue ? -1 : 1));
      localStorage.setItem(`stanpc:${type}:${cardSlug}`, active ? "1" : "0");
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => toggle("owned")}
        aria-pressed={owns}
        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          owns
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-neutral-200 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
        }`}
      >
        {owns ? "✓ Owned" : "Owned"} · {ownedCount}
      </button>
      <button
        type="button"
        onClick={() => toggle("wished")}
        aria-pressed={wishes}
        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          wishes
            ? "border-pink-600 bg-pink-600 text-white"
            : "border-neutral-200 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
        }`}
      >
        {wishes ? "★ Wish" : "Wish"} · {wishedCount}
      </button>
    </div>
  );
}
