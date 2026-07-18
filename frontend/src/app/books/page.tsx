"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { BookDetails } from "@/lib/types";
import { BookCard } from "@/components/book-card";
import { BookFormModal } from "@/components/book-form-modal";
import { Alert, Button, Spinner, inputClass } from "@/components/ui";

export default function BooksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<BookDetails[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setBooks(await api.listBooks());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setError(err instanceof ApiError ? err : new ApiError(0, "Network error"));
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  if (authLoading || (!books && !error)) {
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
            <strong>Verify your email first.</strong> We sent you a
            verification link when you signed up — click it, then reload this
            page.
          </Alert>
        ) : (
          <Alert kind="error">{error.message}</Alert>
        )}
      </div>
    );
  }

  const filtered = (books ?? []).filter((b) =>
    `${b.title} ${b.author}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Books</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {books?.length ?? 0} title{books?.length === 1 ? "" : "s"} on the shelf
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            className={`${inputClass} w-56`}
            placeholder="Search title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => setShowForm(true)}>+ Add book</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-20 text-center text-stone-500 dark:text-stone-400">
          {books && books.length === 0 ? (
            <>
              <span className="text-5xl">🕮</span>
              <p className="mt-4">
                Your shelf is empty — add your first book to get started.
              </p>
            </>
          ) : (
            <p>No books match “{search}”.</p>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <BookCard key={book.uid} book={book} />
          ))}
        </div>
      )}

      {showForm && (
        <BookFormModal
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            await api.createBook(data);
            await load();
          }}
        />
      )}
    </div>
  );
}
