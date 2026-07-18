"use client";

import Link from "next/link";
import type { BookDetails } from "@/lib/types";
import { StarRating } from "./ui";

const COVER_GRADIENTS = [
  "from-amber-500 to-orange-700",
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-indigo-700",
  "from-rose-500 to-pink-700",
  "from-violet-500 to-purple-700",
  "from-lime-500 to-green-700",
];

function coverFor(uid: string) {
  let hash = 0;
  for (const ch of uid) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

export function BookCard({ book }: { book: BookDetails }) {
  const avgRating =
    book.reviews.length > 0
      ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length
      : 0;

  return (
    <Link
      href={`/books/${book.uid}`}
      className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
    >
      <div
        className={`flex h-36 items-end bg-gradient-to-br p-4 ${coverFor(book.uid)}`}
      >
        <h3 className="font-serif text-lg font-bold leading-snug text-white drop-shadow-sm">
          {book.title}
        </h3>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
          {book.author}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {book.publisher} · {book.page_count} pages · {book.language}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <StarRating value={Math.round(avgRating)} size="text-sm" />
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {book.reviews.length > 0
              ? `${avgRating.toFixed(1)} (${book.reviews.length})`
              : "No reviews yet"}
          </span>
        </div>
      </div>
    </Link>
  );
}
