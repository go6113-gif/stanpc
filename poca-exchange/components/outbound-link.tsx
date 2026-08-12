"use client";

function trackOutboundClick(cardId: string, market: "ebay" | "buyee") {
  const payload = JSON.stringify({ cardId, market });

  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/tracking/outbound", blob);
    return;
  }

  fetch("/api/tracking/outbound", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function OutboundLink({
  href,
  cardId,
  market,
  className,
  children,
}: {
  href: string;
  cardId: string;
  market: "ebay" | "buyee";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={className}
      onClick={() => trackOutboundClick(cardId, market)}
    >
      {children}
    </a>
  );
}
