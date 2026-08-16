"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Package, Repeat2 } from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  id: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "홈",
    icon: <Home size={24} />,
    href: "/",
  },
  {
    id: "explore",
    label: "탐색",
    icon: <Search size={24} />,
    href: "/gallery",
  },
  {
    id: "binder",
    label: "바인더",
    icon: <Package size={24} />,
    href: "/binder-export",
  },
  {
    id: "trade",
    label: "교환",
    icon: <Repeat2 size={24} />,
    href: "/trade",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/gallery")) return "explore";
    if (pathname.startsWith("/binder")) return "binder";
    if (pathname.startsWith("/trade")) return "trade";
    return "home";
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-gray-900/90 backdrop-blur-lg sm:hidden">
      <div className="flex w-full items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-1 flex-col items-center justify-center py-3 text-center transition-colors duration-200"
            >
              <motion.div
                className={`flex flex-col items-center gap-1.5 transition-colors ${
                  isActive
                    ? "text-rose-400"
                    : "text-neutral-400 hover:text-neutral-300"
                }`}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="relative">
                  {item.icon}
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-rose-400"
                      layoutId="activeIndicator"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    />
                  )}
                </div>
                <span className="text-xs font-semibold leading-tight">
                  {item.label}
                </span>
              </motion.div>

              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-rose-400/10"
                  layoutId="activeBackground"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  style={{ zIndex: -1 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
