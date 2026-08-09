"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FaBookmark, FaRegBookmark, FaArrowTrendUp } from "react-icons/fa6";
import type { Post } from "@/data/posts";
import type { BlogPost } from "@/types/blog";
import { TagPills } from "@/components/blog/TagPills";
import {
  authorInitials,
  blogCategoriesFromPosts,
  categoryBadgeClass,
  formatPostDate,
} from "@/lib/blog";
import { collectTagsFromPosts, filterPostsByTag } from "@/lib/blogTags";

function MediumPostCard({ post }: { post: Post }) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <article className="group flex flex-col justify-between border-b border-black/10 py-7 dark:border-white/10 sm:flex-row sm:items-center sm:gap-8">
      <div className="min-w-0 flex-1">
        {/* Author Line */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-[#6B6558] dark:text-slate-400">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E3FE0] text-[10px] font-bold text-white shadow-sm"
            aria-hidden
          >
            {authorInitials(post.author)}
          </span>
          <span className="min-w-0 font-bold text-[#2A2A28] dark:text-white">{post.author}</span>
          <span className="opacity-50">·</span>
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        </div>

        {/* Article Link */}
        <Link href={`/blog/${post.slug}`} className="group/link block">
          <h3 className="font-display-custom mt-2.5 text-xl font-extrabold leading-snug text-[#2A2A28] transition group-hover/link:text-[#1E3FE0] dark:text-white dark:group-hover/link:text-[#60A5FA] sm:text-2xl">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
            {post.excerpt}
          </p>
        </Link>

        {/* Footer Meta */}
        <div className="mt-4 space-y-3">
          {post.tags.length > 0 ? <TagPills tags={post.tags} size="sm" /> : null}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${categoryBadgeClass(post.category)}`}>
                {post.category}
              </span>
              <span className="text-xs font-semibold text-[#6B6558] dark:text-slate-400">
                {post.readTime}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBookmarked(!bookmarked)}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
              className="text-[#6B6558] transition hover:text-[#1E3FE0] dark:text-slate-400 dark:hover:text-white"
            >
              {bookmarked ? (
                <FaBookmark className="h-4 w-4 text-[#1E3FE0]" />
              ) : (
                <FaRegBookmark className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cover Image Thumbnail */}
      <Link href={`/blog/${post.slug}`} className="relative mt-4 aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-black/5 sm:mt-0 sm:w-44 sm:aspect-[4/3]">
        <Image
          src={post.coverImage}
          alt={`Cover image: ${post.title}`}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="176px"
        />
      </Link>
    </article>
  );
}

function HeroFeaturedCard({ post }: { post: Post }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-black/10 bg-[#F6F1E4] shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A]">
      <Link href={`/blog/${post.slug}`} className="grid grid-cols-1 lg:grid-cols-12">
        <div className="relative aspect-video w-full overflow-hidden bg-black/5 lg:col-span-7 lg:aspect-auto lg:h-full">
          <Image
            src={post.coverImage}
            alt={`Cover image: ${post.title}`}
            fill
            priority
            className="object-cover transition duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>
        <div className="flex flex-col justify-between p-5 sm:p-8 lg:col-span-5 lg:p-10">
          <div>
            <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ FEATURED COVER STORY
            </span>
            <span className={`mt-2 block w-fit rounded-full px-3 py-1 text-xs font-bold ${categoryBadgeClass(post.category)}`}>
              {post.category}
            </span>
            <h2 className="font-display-custom mt-3 text-2xl font-extrabold text-[#2A2A28] transition group-hover:text-[#1E3FE0] dark:text-white dark:group-hover:text-[#60A5FA] sm:text-3xl">
              {post.title}
            </h2>
            <p className="mt-3 line-clamp-3 text-sm font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
              {post.excerpt}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/10 pt-4 dark:border-white/10">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E3FE0] text-xs font-bold text-white shadow-md"
              aria-hidden
            >
              {authorInitials(post.author)}
            </span>
            <div className="text-xs font-semibold text-[#6B6558] dark:text-slate-400">
              <p className="font-bold text-[#2A2A28] dark:text-white">{post.author}</p>
              <p className="mt-0.5">
                <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {post.readTime}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

type Props = {
  readonly posts: readonly Post[];
  readonly initialTag?: string;
};

export function BlogListing({ posts, initialTag }: Props) {
  const categories = useMemo(() => blogCategoriesFromPosts(posts.map((p) => p.category)), [posts]);
  const allTags = useMemo(() => collectTagsFromPosts(posts), [posts]);
  const [filter, setFilter] = useState<string>("All");
  const [tagFilter, setTagFilter] = useState<string | null>(initialTag?.trim() || null);

  const filtered = useMemo(() => {
    let list = filter === "All" ? [...posts] : posts.filter((p) => p.category === filter);
    list = filterPostsByTag(list, tagFilter);
    return list;
  }, [posts, filter, tagFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered],
  );

  const featuredPost = useMemo(() => sorted.find((p) => p.featured) ?? sorted[0], [sorted]);
  const streamPosts = useMemo(
    () => sorted.filter((p) => p.slug !== featuredPost?.slug),
    [sorted, featuredPost],
  );

  return (
    <div className="relative bg-[#EDE6D3] pb-24 text-[#2A2A28] dark:bg-[#070B19] dark:text-slate-200">
      {/* Blueprint Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.07] dark:[background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)]"
        aria-hidden="true"
      />

      {/* Publication Header */}
      <header className="relative border-b border-black/10 py-10 text-center dark:border-white/10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ THE GENVALUE DISPATCH
          </span>
          <h1 className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl md:text-6xl">
            AI Tooling & Workflow Journal
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-[#6B6558] dark:text-slate-300 sm:text-base md:text-lg">
            Deep dives on AI tool selection, prompt engineering, and workflow automation written by practitioners at GenValue.
          </p>
        </div>
      </header>

      {/* Category Tabs Bar */}
      <div className="sticky top-16 z-30 border-b border-black/10 bg-[#EDE6D3]/90 backdrop-blur-md dark:border-white/10 dark:bg-[#070B19]/90 sm:top-20">
        <div className="mx-auto max-w-[1200px] px-4 py-3 sm:px-6">
          <div
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
            role="toolbar"
            aria-label="Filter stories by category"
          >
            <button
              type="button"
              onClick={() => setFilter("All")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filter === "All"
                  ? "bg-[#1E3FE0] text-white shadow-md"
                  : "border border-black/10 bg-white/70 text-[#2A2A28] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              }`}
            >
              All Stories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  filter === cat
                    ? "bg-[#1E3FE0] text-white shadow-md"
                    : "border border-black/10 bg-white/70 text-[#2A2A28] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {allTags.length > 0 ? (
            <div className="mt-3 max-h-28 overflow-y-auto border-t border-black/5 pt-3 dark:border-white/10 sm:max-h-none sm:overflow-visible">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-500">
                Topics
              </p>
              <TagPills
                tags={allTags.slice(0, 16)}
                activeTag={tagFilter}
                onTagClick={setTagFilter}
                linkToBlog={false}
                size="sm"
              />
              {tagFilter ? (
                <button
                  type="button"
                  onClick={() => setTagFilter(null)}
                  className="mt-2 text-xs font-bold text-[#1E3FE0] dark:text-[#60A5FA]"
                  aria-label="Clear topic filter"
                >
                  Clear topic filter
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        {/* Featured Cover Story */}
        {featuredPost ? (
          <section className="mb-16">
            <HeroFeaturedCard post={featuredPost} />
          </section>
        ) : null}

        {/* 2-Column Medium Layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Article Stream (Left 8 cols) */}
          <section className="lg:col-span-8">
            <h2 className="font-display-custom border-b border-black/10 pb-4 text-xl font-extrabold text-[#2A2A28] dark:border-white/10 dark:text-white">
              Latest Dispatches
            </h2>

            {streamPosts.length > 0 ? (
              <div className="divide-y divide-black/10 dark:divide-white/10">
                {streamPosts.map((post) => (
                  <MediumPostCard key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-[#6B6558] dark:text-slate-400">
                {tagFilter
                  ? `No stories tagged #${tagFilter} yet.`
                  : "No stories published in this category yet."}
              </p>
            )}
          </section>

          {/* Medium Publication Sidebar (Right 4 cols) */}
          <aside className="space-y-8 lg:col-span-4">
            {/* Trending Reads */}
            <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E8622E]">
                <FaArrowTrendUp className="h-4 w-4" />
                <span>Trending Reads</span>
              </div>
              <ul className="mt-4 divide-y divide-black/10 dark:divide-white/10">
                {posts.slice(0, 3).map((p, idx) => (
                  <li key={`trending-${p.slug}`} className="py-3">
                    <Link href={`/blog/${p.slug}`} className="group block">
                      <span className="font-display-custom text-xs font-black text-[#1E3FE0] dark:text-[#60A5FA]">
                        0{idx + 1}
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-[#2A2A28] transition group-hover:text-[#1E3FE0] dark:text-white dark:group-hover:text-[#60A5FA]">
                        {p.title}
                      </h4>
                      <p className="mt-1 text-[11px] font-semibold text-[#6B6558] dark:text-slate-400">
                        {p.readTime}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Subscribe */}
            <div className="rounded-2xl border border-black/10 bg-[#12266E] p-6 text-white shadow-xl">
              <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
                ★ WEEKLY DISPATCH
              </span>
              <h3 className="font-display-custom mt-2 text-xl font-extrabold text-white">
                Get Weekly AI Frameworks
              </h3>
              <p className="mt-2 text-xs font-medium text-[#DFE3F7]">
                Join 500+ professionals reading our prompt templates & tool comparisons.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex flex-col gap-2.5">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#E8622E]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#E8622E] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#d55321]"
                >
                  Subscribe Free
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
