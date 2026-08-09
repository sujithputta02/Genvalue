/** Shared formatting and styling for blog UI. */

export function formatPostDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

const CATEGORY_BADGE: Record<string, string> = {
  Marketing:
    "bg-[#E8622E]/15 text-[#B45309] ring-[#E8622E]/25 dark:bg-[#E8622E]/20 dark:text-[#FDBA74] dark:ring-[#E8622E]/35",
  "General AI":
    "bg-[#1E3FE0]/12 text-[#12266E] ring-[#1E3FE0]/25 dark:bg-[#1E3FE0]/25 dark:text-[#93C5FD] dark:ring-[#60A5FA]/35",
  "AI Agents":
    "bg-[#12266E]/12 text-[#12266E] ring-[#12266E]/20 dark:bg-[#12266E]/40 dark:text-[#BFDBFE] dark:ring-[#60A5FA]/30",
  Automation:
    "bg-[#F59E0B]/15 text-[#92400E] ring-[#F59E0B]/30 dark:bg-[#F59E0B]/20 dark:text-[#FCD34D] dark:ring-[#FBBF24]/35",
  Strategy:
    "bg-[#10B981]/15 text-[#065F46] ring-[#10B981]/25 dark:bg-[#10B981]/20 dark:text-[#6EE7B7] dark:ring-[#34D399]/35",
};

export function categoryBadgeClass(category: string): string {
  return (
    CATEGORY_BADGE[category] ??
    "bg-[#2A2A28]/8 text-[#2A2A28] ring-[#2A2A28]/15 dark:bg-white/10 dark:text-slate-200 dark:ring-white/20"
  );
}

export function blogCategoriesFromPosts(categories: readonly string[]): string[] {
  return [...new Set(categories)].sort((a, b) => a.localeCompare(b));
}
