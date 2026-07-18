"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UserWithBooks } from "@/lib/types";
import { Alert, Spinner, StarRating } from "@/components/ui";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserWithBooks | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .me()
      .then(setProfile)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(
          err instanceof ApiError ? err : new ApiError(0, "Network error"),
        );
      });
  }, [authLoading, user, router]);

  if (authLoading || (!profile && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        {error.code === "account_not_verified" ? (
          <Alert kind="info">
            <strong>Verify your email first.</strong> Click the link we sent
            you when you signed up, then reload this page.
          </Alert>
        ) : (
          <Alert kind="error">{error.message}</Alert>
        )}
      </div>
    );
  }

  const p = profile!;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 font-serif text-2xl font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {p.first_name[0]}
            {p.last_name[0]}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {p.first_name} {p.last_name}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              @{p.username} · {p.email}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              {p.role === "admin" ? "Administrator" : "Member"} · joined{" "}
              {new Date(p.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-6 dark:border-stone-800">
          <div className="rounded-xl bg-stone-50 p-4 text-center dark:bg-stone-800/50">
            <dt className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Books shelved
            </dt>
            <dd className="mt-1 font-serif text-3xl font-bold">
              {p.books.length}
            </dd>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 text-center dark:bg-stone-800/50">
            <dt className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Reviews written
            </dt>
            <dd className="mt-1 font-serif text-3xl font-bold">
              {p.reviews.length}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-bold">My books</h2>
        {p.books.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            You haven&apos;t added any books yet.{" "}
            <Link href="/books" className="font-semibold text-amber-700 hover:underline dark:text-amber-500">
              Add one →
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {p.books.map((book) => (
              <li key={book.uid}>
                <Link
                  href={`/books/${book.uid}`}
                  className="flex items-center justify-between px-5 py-4 transition hover:bg-stone-50 dark:hover:bg-stone-800/50"
                >
                  <div>
                    <p className="font-medium">{book.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {book.author} · {book.page_count} pages
                    </p>
                  </div>
                  <span className="text-stone-300 dark:text-stone-600">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-bold">My reviews</h2>
        {p.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            No reviews yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {p.reviews.map((review) => (
              <li
                key={review.uid}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-center justify-between">
                  <StarRating value={review.rating} size="text-base" />
                  <span className="text-xs text-stone-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                  {review.review_text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
