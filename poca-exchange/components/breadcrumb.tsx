"use client";

import Link from "next/link";

export interface BreadcrumbItem {
  name: string;
  url?: string; // If no url, renders as static text
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={`mb-4 text-sm text-gray-600 ${className}`}
    >
      <ol className="flex items-center gap-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-400">/</span>}
            {item.url ? (
              <Link
                href={item.url}
                className="hover:text-gray-900 hover:underline transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
