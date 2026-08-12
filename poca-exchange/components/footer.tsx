import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 py-6 text-sm text-neutral-500 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between sm:px-6">
        <span>
          &copy; {new Date().getUTCFullYear()} {siteConfig.name}
        </span>
        <a href={`mailto:${siteConfig.supportEmail}`} className="hover:underline">
          {siteConfig.supportEmail}
        </a>
      </div>
    </footer>
  );
}
