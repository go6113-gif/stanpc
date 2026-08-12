"use client";

import { useEffect, useState } from "react";

export function HaveWantToggle({
  cardSlug,
  initialHaveCount,
  initialWantCount,
}: {
  cardSlug: string;
  initialHaveCount: number;
  initialWantCount: number;
}) {
  const [haveCount, setHaveCount] = useState(initialHaveCount);
  const [wantCount, setWantCount] = useState(initialWantCount);
  const [hasIt, setHasIt] = useState(false);
  const [wantsIt, setWantsIt] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR, so state defaults to false on
    // the server and hydrates from the client-only store once mounted here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasIt(localStorage.getItem(`stanpc:have:${cardSlug}`) === "1");
    setWantsIt(localStorage.getItem(`stanpc:want:${cardSlug}`) === "1");
  }, [cardSlug]);

  async function toggle(type: "have" | "want") {
    const active = type === "have" ? hasIt : wantsIt;
    const nextValue = !active;
    const setActive = type === "have" ? setHasIt : setWantsIt;
    const setCount = type === "have" ? setHaveCount : setWantCount;

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
      setHaveCount(data.haveCount);
      setWantCount(data.wantCount);
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
        onClick={() => toggle("have")}
        aria-pressed={hasIt}
        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          hasIt
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-neutral-200 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
        }`}
      >
        {hasIt ? "✓ Have" : "Have"} · {haveCount}
      </button>
      <button
        type="button"
        onClick={() => toggle("want")}
        aria-pressed={wantsIt}
        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          wantsIt
            ? "border-pink-600 bg-pink-600 text-white"
            : "border-neutral-200 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
        }`}
      >
        {wantsIt ? "★ Want" : "Want"} · {wantCount}
      </button>
    </div>
  );
}
