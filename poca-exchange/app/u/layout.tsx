import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 포카 바인더 — StanPC",
  description: "내가 수집한 K-pop 포토카드를 한눈에 보고 SNS에 공유하세요.",
};

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
