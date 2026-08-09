"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import { TagPills } from "@/components/blog/TagPills";
import type { BlogPost } from "@/types/blog";
import { posts as staticPosts } from "@/data/posts";
import { fetchPublishedPosts, mergeBlogPosts } from "@/services/blogService";
import { authorInitials, categoryBadgeClass, formatPostDate } from "@/lib/blog";
import { blogTagHref, collectTagsFromPosts, filterPostsByTag } from "@/lib/blogTags";

export function DispatchFeed() {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublishedPosts({ limit: 50 });
        if (!cancelled) {
          setAllPosts(mergeBlogPosts(data, staticPosts));
        }
      } catch {
        if (!cancelled) {
          setAllPosts(staticPosts);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const popularTags = useMemo(() => collectTagsFromPosts(allPosts).slice(0, 12), [allPosts]);

  const posts = useMemo(() => {
    const filtered = filterPostsByTag(allPosts, activeTag);
    return filtered.slice(0, 3);
  }, [allPosts, activeTag]);

  if (!loading && allPosts.length === 0 && !error) return null;

  return (
    <section
      className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="dispatch-feed-heading"
    >
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="font-annotation inline-block -rotate-1 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ THE GENVALUE DISPATCH
          </span>
          <h2
            id="dispatch-feed-heading"
            className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-4xl"
          >
            {activeTag ? `Dispatches tagged #${activeTag}` : "From Our Community"}
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium text-[#6B6558] dark:text-slate-400">
            {activeTag
              ? "Stories from students and the GenValue team on this topic."
              : "Student and team dispatches on AI tools, workflows, and real-world wins."}
          </p>
        </div>
        <Link
          href={activeTag ? blogTagHref(activeTag) : "/blog"}
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1E3FE0] transition hover:text-[#12266E] visited:text-[#1E3FE0] dark:text-[#60A5FA] dark:hover:text-white dark:visited:text-[#60A5FA]"
          aria-label={activeTag ? `View all posts tagged ${activeTag}` : "View all dispatches"}
        >
          {activeTag ? "View all on Dispatch" : "View all dispatches"}
          <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {popularTags.length > 0 ? (
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-500">
            Browse by topic
          </p>
          <TagPills
            tags={popularTags}
            activeTag={activeTag}
            onTagClick={setActiveTag}
            linkToBlog={false}
            size="md"
          />
          {activeTag ? (
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="mt-3 text-xs font-bold text-[#E8622E] hover:text-[#d55321] dark:text-[#E8622E]"
              aria-label="Clear tag filter"
            >
              Clear filter
            </button>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Loading dispatches">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-black/10 bg-[#F6F1E4] dark:border-white/10 dark:bg-[#0D1B2A]"
            />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-[#F6F1E4]/60 px-6 py-10 text-center text-sm text-[#6B6558] dark:border-white/10 dark:bg-[#0D1B2A]/60 dark:text-slate-400">
          {error}
        </p>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-[#F6F1E4]/60 px-6 py-10 text-center text-sm text-[#6B6558] dark:border-white/10 dark:bg-[#0D1B2A]/60 dark:text-slate-400">
          No dispatches found for this tag yet.{" "}
          <button type="button" onClick={() => setActiveTag(null)} className="font-bold text-[#1E3FE0]">
            Show all
          </button>
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post, index) => (
            <motion.article
              key={post.id ?? post.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#F6F1E4] shadow-lg dark:border-white/10 dark:bg-[#0D1B2A]"
            >
              <Link href={`/blog/${post.slug}`} className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={`Cover: ${post.title}`}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6B6558] dark:text-slate-400">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#12266E] text-[10px] font-bold text-white dark:bg-[#1E3FE0]"
                    aria-hidden
                  >
                    {authorInitials(post.author)}
                  </span>
                  <span className="font-bold text-[#2A2A28] dark:text-white">{post.author}</span>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 block flex-1 text-[#2A2A28] visited:text-[#2A2A28] dark:text-white dark:visited:text-white"
                >
                  <h3 className="font-display-custom text-lg font-extrabold leading-snug text-[#2A2A28] transition group-hover:text-[#1E3FE0] dark:text-white dark:group-hover:text-[#60A5FA]">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#6B6558] dark:text-slate-300">
                    {post.excerpt}
                  </p>
                </Link>
                {post.tags.length > 0 ? (
                  <div className="mt-3">
                    <TagPills tags={post.tags.slice(0, 3)} size="sm" />
                  </div>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${categoryBadgeClass(post.category)}`}
                  >
                    {post.category}
                  </span>
                  <time dateTime={post.date} className="text-xs font-semibold text-[#6B6558] dark:text-slate-500">
                    {formatPostDate(post.date)}
                  </time>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
