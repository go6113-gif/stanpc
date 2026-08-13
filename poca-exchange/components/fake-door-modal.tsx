"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, type TranslationKey } from "@/lib/i18n";

export type FakeDoorSource =
  | "pro_upgrade_header"
  | "profile_dropdown_pro"
  | "ai_scan"
  | "multi_binder"
  | "wiki_report";

// Per-source copy override — defaults to the "Pro 플랜" copy (fake_door.*)
// for the original CTAs; a source can point at a different i18n namespace
// for its own title/subtitle/submit-button text (e.g. the Tab 1 위키 수정
// 제보 button, which shouldn't say "Pro 플랜").
const COPY_OVERRIDE: Partial<
  Record<FakeDoorSource, { title: TranslationKey; subtitle: TranslationKey; submit: TranslationKey }>
> = {
  wiki_report: {
    title: "cardDetail.guide.reportModalTitle",
    subtitle: "cardDetail.guide.reportModalSubtitle",
    submit: "cardDetail.guide.reportModalSubmit",
  },
};

interface FakeDoorModalProps {
  open: boolean;
  source: FakeDoorSource | null;
  onClose: () => void;
}

// Fake Door demand-validation modal (Phase 1). No payment module exists —
// see docs/PHASE2_ROADMAP.md. This only records interest via
// POST /api/waitlist so we can measure real demand before building the
// paid feature.
export function FakeDoorModal({ open, source, onClose }: FakeDoorModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const { t } = useTranslations();
  const copy = source ? COPY_OVERRIDE[source] : undefined;
  const titleKey = copy?.title ?? "fake_door.title";
  const subtitleKey = copy?.subtitle ?? "fake_door.subtitle";
  const submitKey = copy?.submit ?? "fake_door.submit_button";

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail("");
      setStatus("idle");
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1A1A1E] p-6 text-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">
                {t(titleKey)}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label={t("fake_door.close_aria")}
                className="text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {status === "done" ? (
              <p className="text-sm text-white/70">
                {t("fake_door.success_message")}
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm text-white/70">
                  {t(subtitleKey)}
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("fake_door.email_placeholder")}
                    className="rounded-full border border-white/10 bg-[#0F0F12] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FF2A55] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="rounded-full bg-[#FF2A55] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {status === "loading"
                      ? t("fake_door.submit_loading")
                      : t(submitKey)}
                  </button>
                  {status === "error" && (
                    <p className="text-xs text-red-400">
                      {t("fake_door.error_message")}
                    </p>
                  )}
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
