"use client";

import Link from "next/link";
import { blogTagHref, tagsEqual } from "@/lib/blogTags";

type Props = {
  tags: readonly string[];
  activeTag?: string | null;
  onTagClick?: (tag: string | null) => void;
  size?: "sm" | "md";
  linkToBlog?: boolean;
};

export function TagPills({ tags, activeTag = null, onTagClick, size = "sm", linkToBlog = true }: Props) {
  if (!tags.length) return null;

  const pillClass = (active: boolean) => {
    const base =
      size === "sm"
        ? "rounded-full px-2.5 py-0.5 text-[10px] font-bold transition"
        : "rounded-full px-3 py-1 text-xs font-bold transition";
    return active
      ? `${base} bg-[#1E3FE0] text-white shadow-sm dark:bg-[#60A5FA] dark:text-[#070B19]`
      : `${base} border border-black/10 bg-[#F6F1E4] text-[#2A2A28] hover:border-[#1E3FE0] hover:text-[#1E3FE0] dark:border-white/10 dark:bg-[#0D1B2A] dark:text-slate-200 dark:hover:text-[#60A5FA]`;
  };

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag) => {
        const active = activeTag ? tagsEqual(tag, activeTag) : false;
        const className = pillClass(active);

        if (linkToBlog && !onTagClick) {
          return (
            <li key={tag}>
              <Link href={blogTagHref(tag)} className={className} aria-label={`View posts tagged ${tag}`}>
                #{tag}
              </Link>
            </li>
          );
        }

        return (
          <li key={tag}>
            <button
              type="button"
              onClick={() => onTagClick?.(active ? null : tag)}
              className={className}
              aria-label={active ? `Clear tag filter ${tag}` : `Filter by tag ${tag}`}
              aria-pressed={active}
            >
              #{tag}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
