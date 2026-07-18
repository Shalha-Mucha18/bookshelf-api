"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { BookDetails, Tag } from "@/lib/types";
import { BookFormModal } from "@/components/book-form-modal";
import {
  Alert,
  Button,
  Field,
  inputClass,
  Spinner,
  StarRating,
} from "@/components/ui";

export default function BookDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [book, setBook] = useState<BookDetails | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const [tagChoice, setTagChoice] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([api.getBook(uid), api.listTags()]);
      setBook(b);
      setTags(t);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load book");
    }
  }, [uid, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  if (authLoading || (!book && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Alert kind="error">{error ?? "Book not found"}</Alert>
      </div>
    );
  }

  const avgRating =
    book.reviews.length > 0
      ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
      : 0;

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError(null);
    if (rating < 1) {
      setReviewError("Pick a star rating first");
      return;
    }
    setReviewBusy(true);
    try {
      await api.addReview(uid, rating, reviewText);
      setRating(0);
      setReviewText("");
      await load();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to post review");
    } finally {
      setReviewBusy(false);
    }
  }

  async function attachTag(e: React.FormEvent) {
    e.preventDefault();
    setTagError(null);
    try {
      let tagUid = tagChoice;
      if (tagUid === "__new__") {
        if (!newTagName.trim()) return;
        const created = await api.createTag(newTagName.trim());
        tagUid = created.uid;
      }
      if (!tagUid) return;
      await api.addTagToBook(tagUid, uid);
      setTagChoice("");
      setNewTagName("");
      await load();
    } catch (err) {
      setTagError(err instanceof Error ? err.message : "Failed to add tag");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete “${book!.title}”? This cannot be undone.`)) return;
    await api.deleteBook(uid);
    router.push("/books");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <button
        onClick={() => router.push("/books")}
        className="text-sm text-stone-500 transition hover:text-stone-800 dark:hover:text-stone-200"
      >
        ← Back to books
      </button>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">{book.title}</h1>
            <p className="mt-1 text-lg text-stone-600 dark:text-stone-400">
              by {book.author}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
          {[
            ["Publisher", book.publisher],
            ["Published", book.published_date],
            ["Pages", String(book.page_count)],
            ["Language", book.language],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
              <dd className="mt-0.5 font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(book.tags ?? []).map((tag) => (
            <span
              key={tag.uid}
              className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
              {tag.name}
            </span>
          ))}

          <form onSubmit={attachTag} className="flex items-center gap-2">
            <select
              className={`${inputClass} w-auto py-1.5 text-xs`}
              value={tagChoice}
              onChange={(e) => setTagChoice(e.target.value)}
            >
              <option value="">Add tag…</option>
              {tags.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {t.name}
                </option>
              ))}
              <option value="__new__">+ New tag</option>
            </select>
            {tagChoice === "__new__" && (
              <input
                className={`${inputClass} w-32 py-1.5 text-xs`}
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            )}
            {tagChoice && (
              <Button type="submit" className="px-3 py-1.5 text-xs">
                Add
              </Button>
            )}
          </form>
        </div>
        {tagError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {tagError} (creating tags may require an admin account)
          </p>
        )}
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-2xl font-bold">Reviews</h2>
          {book.reviews.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
              <StarRating value={Math.round(avgRating)} size="text-base" />
              {avgRating.toFixed(1)} · {book.reviews.length} review
              {book.reviews.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <form
          onSubmit={submitReview}
          className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
        >
          <Field label="Your rating">
            <StarRating value={rating} onChange={setRating} size="text-2xl" />
          </Field>
          <div className="mt-3">
            <Field label="Your review">
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think?"
                required
              />
            </Field>
          </div>
          {reviewError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {reviewError}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={reviewBusy}>
              {reviewBusy && <Spinner />} Post review
            </Button>
          </div>
        </form>

        <ul className="mt-6 space-y-4">
          {book.reviews.map((review) => (
            <li
              key={review.uid}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center justify-between">
                <StarRating value={review.rating} size="text-base" />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={async () => {
                      await api.deleteReview(review.uid).catch(() => {});
                      await load();
                    }}
                    className="text-xs text-stone-400 transition hover:text-red-600"
                    title="Delete review"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                {review.review_text}
              </p>
            </li>
          ))}
          {book.reviews.length === 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No reviews yet — be the first.
            </p>
          )}
        </ul>
      </section>

      {showEdit && (
        <BookFormModal
          initial={book}
          onClose={() => setShowEdit(false)}
          onSubmit={async (data) => {
            await api.updateBook(uid, data);
            await load();
          }}
        />
      )}
    </div>
  );
}
